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
  afterSalesImage,
  appOrder,
  appUser,
} from '@server/database/schema';
import type {
  AfterSales,
  AfterSalesImage,
  AfterSalesListParams,
  CreateAfterSalesRequest,
  PaginatedResponse,
} from '@shared/api.interface';

@Injectable()
export class AfterSalesService {
  private readonly logger = new Logger(AfterSalesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async resolveAppUserId(userId: string): Promise<string> {
    const rows = await this.db
      .select({ id: appUser.id })
      .from(appUser)
      .where(eq(appUser.userId, userId))
      .limit(1);
    if (rows.length > 0) return rows[0].id;
    const inserted = await this.db
      .insert(appUser)
      .values({
        userId,
        nickname: '會員',
        status: 'active',
        totalConsumption: '0',
      })
      .returning({ id: appUser.id });
    return inserted[0].id;
  }

  async generateAfterSalesNo(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const datePart = `${y}${m}${d}`;
    const prefix = `AS${datePart}`;

    const rows = await this.db
      .select({ afterSalesNo: afterSales.afterSalesNo })
      .from(afterSales)
      .where(like(afterSales.afterSalesNo, `${prefix}%`))
      .orderBy(desc(afterSales.afterSalesNo))
      .limit(1);

    let seq = 1;
    if (rows.length > 0 && rows[0].afterSalesNo) {
      const seqStr = rows[0].afterSalesNo.slice(prefix.length);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  mapAfterSales(row: typeof afterSales.$inferSelect): AfterSales {
    return {
      id: row.id,
      afterSalesNo: row.afterSalesNo,
      orderId: row.orderId,
      userId: row.userId,
      type: row.type as 'refund_only' | 'return_refund',
      reason: row.reason,
      description: row.description ?? undefined,
      refundAmount: Number(row.refundAmount ?? 0),
      status: row.status as
        | 'pending'
        | 'approved'
        | 'returning'
        | 'refunding'
        | 'completed'
        | 'rejected',
      returnTrackingNo: row.returnTrackingNo ?? undefined,
      returnCompany: row.returnCompany ?? undefined,
      rejectReason: row.rejectReason ?? undefined,
      auditTime: row.auditTime ? row.auditTime.toISOString() : undefined,
      refundTime: row.refundTime ? row.refundTime.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getImages(afterSalesId: string): Promise<AfterSalesImage[]> {
    const rows = await this.db
      .select()
      .from(afterSalesImage)
      .where(eq(afterSalesImage.afterSalesId, afterSalesId))
      .orderBy(afterSalesImage.sort);
    return rows.map((row) => ({
      id: row.id,
      afterSalesId: row.afterSalesId,
      imageUrl: row.imageUrl,
      sort: row.sort,
    }));
  }

  async create(
    userId: string,
    dto: CreateAfterSalesRequest,
  ): Promise<AfterSales & { images?: AfterSalesImage[] }> {
    const appUserId = await this.resolveAppUserId(userId);

    const orderRows = await this.db
      .select()
      .from(appOrder)
      .where(and(eq(appOrder.id, dto.orderId), eq(appOrder.userId, appUserId)))
      .limit(1);
    if (orderRows.length === 0) {
      throw new NotFoundException('Order not found');
    }
    const order = orderRows[0];
    if (order.orderStatus !== 'shipped' && order.orderStatus !== 'completed') {
      throw new BadRequestException(
        'Only shipped or completed orders can apply for after-sales',
      );
    }

    const payAmount = Number(order.payAmount ?? 0);
    if (dto.refundAmount > payAmount) {
      throw new BadRequestException(
        'Refund amount cannot exceed order pay amount',
      );
    }
    if (dto.refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    const afterSalesNo = await this.generateAfterSalesNo();

    const inserted = await this.db
      .insert(afterSales)
      .values({
        afterSalesNo,
        orderId: dto.orderId,
        userId: appUserId,
        type: dto.type,
        reason: dto.reason,
        description: dto.description,
        refundAmount: dto.refundAmount.toString(),
        status: 'pending',
      })
      .returning();

    const record = this.mapAfterSales(inserted[0]);

    if (dto.images && dto.images.length > 0) {
      const imageValues = dto.images.map((url: string, idx: number) => ({
        afterSalesId: record.id,
        imageUrl: url,
        sort: idx,
      }));
      await this.db.insert(afterSalesImage).values(imageValues);
      record.images = await this.getImages(record.id);
    }

    this.logger.log(`After-sales created: ${afterSalesNo}`);
    return record;
  }

  async getUserList(
    userId: string,
    params: AfterSalesListParams,
  ): Promise<PaginatedResponse<AfterSales & { orderNo?: string }>> {
    const appUserId = await this.resolveAppUserId(userId);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const conditions = [eq(afterSales.userId, appUserId)];
    if (params.status) {
      conditions.push(eq(afterSales.status, params.status));
    }

    const baseQuery = this.db
      .select({
        as: afterSales,
        orderNo: appOrder.orderNo,
      })
      .from(afterSales)
      .leftJoin(appOrder, eq(afterSales.orderId, appOrder.id))
      .where(and(...conditions));

    const [countResult] = await this.db
      .select({ count: count() })
      .from(afterSales)
      .where(and(...conditions));

    const rows = await baseQuery
      .orderBy(desc(afterSales.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = Number(countResult?.count ?? 0);

    return {
      items: rows.map((row) => ({
        ...this.mapAfterSales(row.as),
        orderNo: row.orderNo ?? undefined,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getUserDetail(
    userId: string,
    id: string,
  ): Promise<AfterSales & { images: AfterSalesImage[]; orderNo?: string }> {
    const appUserId = await this.resolveAppUserId(userId);
    const rows = await this.db
      .select({
        as: afterSales,
        orderNo: appOrder.orderNo,
      })
      .from(afterSales)
      .leftJoin(appOrder, eq(afterSales.orderId, appOrder.id))
      .where(and(eq(afterSales.id, id), eq(afterSales.userId, appUserId)))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const images = await this.getImages(id);
    return {
      ...this.mapAfterSales(rows[0].as),
      orderNo: rows[0].orderNo ?? undefined,
      images,
    };
  }

  async submitReturnTracking(
    userId: string,
    id: string,
    trackingNo: string,
    company: string,
  ): Promise<AfterSales> {
    const appUserId = await this.resolveAppUserId(userId);
    const rows = await this.db
      .select()
      .from(afterSales)
      .where(and(eq(afterSales.id, id), eq(afterSales.userId, appUserId)))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('After-sales record not found');
    }
    const record = rows[0];
    if (record.status !== 'approved') {
      throw new BadRequestException(
        'Only approved return records can submit tracking',
      );
    }
    if (record.type !== 'return_refund') {
      throw new BadRequestException(
        'Only return_refund type can submit return tracking',
      );
    }

    const updated = await this.db
      .update(afterSales)
      .set({
        returnTrackingNo: trackingNo,
        returnCompany: company,
        status: 'returning',
      })
      .where(eq(afterSales.id, id))
      .returning();

    this.logger.log(`Return tracking submitted: ${record.afterSalesNo}`);
    return this.mapAfterSales(updated[0]);
  }
}
