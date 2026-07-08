import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql, desc, count, like } from 'drizzle-orm';
import {
  afterSales,
  appOrder,
  orderItem,
  product,
} from '@server/database/schema';
import type {
  AfterSales,
  AfterSalesImage,
  AfterSalesListParams,
  PaginatedResponse,
} from '@shared/api.interface';
import { AfterSalesService } from './after-sales.service';

@Injectable()
export class AdminAfterSalesService {
  private readonly logger = new Logger(AdminAfterSalesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly afterSalesService: AfterSalesService,
  ) {}

  async getAdminList(
    params: AfterSalesListParams,
  ): Promise<PaginatedResponse<AfterSales & { orderNo?: string }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const asConditions = [];
    if (params.status) {
      asConditions.push(eq(afterSales.status, params.status));
    }
    if (params.afterSalesNo) {
      asConditions.push(
        like(afterSales.afterSalesNo, `%${params.afterSalesNo}%`),
      );
    }

    const hasOrderFilter = !!params.orderNo;

    const baseFrom = hasOrderFilter
      ? this.db
          .select({
            as: afterSales,
            orderNo: appOrder.orderNo,
          })
          .from(afterSales)
          .innerJoin(appOrder, eq(afterSales.orderId, appOrder.id))
      : this.db
          .select({
            as: afterSales,
            orderNo: appOrder.orderNo,
          })
          .from(afterSales)
          .leftJoin(appOrder, eq(afterSales.orderId, appOrder.id));

    const whereConditions = [...asConditions];
    if (hasOrderFilter) {
      whereConditions.push(like(appOrder.orderNo, `%${params.orderNo}%`));
    }

    const baseQuery = baseFrom.where(
      whereConditions.length > 0 ? and(...whereConditions) : undefined,
    );

    const countFrom = hasOrderFilter
      ? this.db
          .select({ count: count() })
          .from(afterSales)
          .innerJoin(appOrder, eq(afterSales.orderId, appOrder.id))
      : this.db.select({ count: count() }).from(afterSales);

    const [countResult] = await countFrom.where(
      whereConditions.length > 0 ? and(...whereConditions) : undefined,
    );

    const rows = await baseQuery
      .orderBy(desc(afterSales.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = Number(countResult?.count ?? 0);

    return {
      items: rows.map((row) => ({
        ...this.afterSalesService.mapAfterSales(row.as),
        orderNo: row.orderNo ?? undefined,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getAdminDetail(
    id: string,
  ): Promise<AfterSales & { images: AfterSalesImage[]; orderNo?: string }> {
    const rows = await this.db
      .select({
        as: afterSales,
        orderNo: appOrder.orderNo,
      })
      .from(afterSales)
      .leftJoin(appOrder, eq(afterSales.orderId, appOrder.id))
      .where(eq(afterSales.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const images = await this.afterSalesService.getImages(id);
    return {
      ...this.afterSalesService.mapAfterSales(rows[0].as),
      orderNo: rows[0].orderNo ?? undefined,
      images,
    };
  }

  async approve(id: string, type: 'refund' | 'return'): Promise<AfterSales> {
    const rows = await this.db
      .select()
      .from(afterSales)
      .where(eq(afterSales.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const record = rows[0];
    if (record.status !== 'pending') {
      throw new BadRequestException('Only pending records can be approved');
    }

    const newStatus = type === 'refund' ? 'refunding' : 'approved';
    const updated = await this.db
      .update(afterSales)
      .set({
        status: newStatus,
        auditTime: new Date(),
      })
      .where(eq(afterSales.id, id))
      .returning();

    this.logger.log(
      `After-sales approved: ${record.afterSalesNo}, type=${type}`,
    );
    return this.afterSalesService.mapAfterSales(updated[0]);
  }

  async reject(id: string, reason: string): Promise<AfterSales> {
    const rows = await this.db
      .select()
      .from(afterSales)
      .where(eq(afterSales.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const record = rows[0];
    if (record.status !== 'pending') {
      throw new BadRequestException('Only pending records can be rejected');
    }

    const updated = await this.db
      .update(afterSales)
      .set({
        status: 'rejected',
        rejectReason: reason,
        auditTime: new Date(),
      })
      .where(eq(afterSales.id, id))
      .returning();

    this.logger.log(`After-sales rejected: ${record.afterSalesNo}`);
    return this.afterSalesService.mapAfterSales(updated[0]);
  }

  async confirmReturnReceived(id: string): Promise<AfterSales> {
    const rows = await this.db
      .select()
      .from(afterSales)
      .where(eq(afterSales.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const record = rows[0];
    if (record.status !== 'returning') {
      throw new BadRequestException(
        'Only returning records can confirm return received',
      );
    }

    const updated = await this.db
      .update(afterSales)
      .set({ status: 'refunding' })
      .where(eq(afterSales.id, id))
      .returning();

    this.logger.log(`Return confirmed received: ${record.afterSalesNo}`);
    return this.afterSalesService.mapAfterSales(updated[0]);
  }

  async completeRefund(id: string): Promise<AfterSales> {
    const rows = await this.db
      .select()
      .from(afterSales)
      .where(eq(afterSales.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const record = rows[0];
    if (record.status !== 'refunding') {
      throw new BadRequestException(
        'Only refunding records can complete refund',
      );
    }

    if (record.type === 'return_refund') {
      const items = await this.db
        .select()
        .from(orderItem)
        .where(eq(orderItem.orderId, record.orderId));

      for (const item of items) {
        let success = false;
        let attempts = 0;
        while (!success && attempts < 3) {
          attempts += 1;
          const prodRows = await this.db
            .select({ id: product.id, version: product.version })
            .from(product)
            .where(eq(product.id, item.productId))
            .limit(1);
          if (prodRows.length === 0) break;
          const prod = prodRows[0];
          const result = await this.db
            .update(product)
            .set({
              stock: sql`${product.stock} + ${item.quantity}`,
              version: sql`${product.version} + 1`,
            })
            .where(
              and(
                eq(product.id, item.productId),
                eq(product.version, prod.version),
              ),
            )
            .returning({ id: product.id });
          if (result.length > 0) success = true;
        }
        if (!success) {
          this.logger.warn(
            `Stock restock failed after 3 attempts: product=${item.productId}`,
          );
        }
      }
    }

    const updated = await this.db
      .update(afterSales)
      .set({
        status: 'completed',
        refundTime: new Date(),
      })
      .where(eq(afterSales.id, id))
      .returning();

    this.logger.log(`After-sales completed: ${record.afterSalesNo}`);
    return this.afterSalesService.mapAfterSales(updated[0]);
  }
}
