import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { receipt, appOrder, orderItem, appUser } from '@server/database/schema';
import type {
  Receipt,
  OrderItem,
  PaginatedResponse,
} from '@shared/api.interface';

type ReceiptRecord = typeof receipt.$inferSelect;
type OrderRecord = typeof appOrder.$inferSelect;

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 订单完成时生成电子收据
   */
  async generateReceipt(orderId: string): Promise<Receipt> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'success') {
      throw new BadRequestException('Order not paid');
    }

    // 检查是否已存在收据
    const existing = await this.db
      .select()
      .from(receipt)
      .where(eq(receipt.orderId, orderId))
      .limit(1);
    if (existing.length > 0) {
      return this.mapReceipt(existing[0], order);
    }

    const receiptNo = await this.generateReceiptNo();
    const inserted = await this.db
      .insert(receipt)
      .values({
        receiptNo,
        orderId,
        userId: order.userId,
        amount: order.payAmount,
        paymentMethod: order.paymentMethod,
        issuedAt: new Date(),
      })
      .returning();

    this.logger.log(`Receipt generated: orderId=${orderId}, receiptNo=${receiptNo}`);
    return this.mapReceipt(inserted[0], order);
  }

  /**
   * 用户查看订单收据（校验归属）
   */
  async getUserReceipt(userId: string, orderId: string): Promise<Receipt & { items: OrderItem[] }> {
    const appUserId = await this.resolveAppUserId(userId);
    const order = await this.findOrderById(orderId);
    if (!order || order.userId !== appUserId) {
      throw new NotFoundException('Order not found');
    }

    const receiptRecord = await this.findReceiptByOrderId(orderId);
    if (!receiptRecord) {
      throw new NotFoundException('Receipt not found');
    }

    const items = await this.getOrderItems(orderId);
    return {
      ...this.mapReceipt(receiptRecord, order),
      items,
      order: this.mapOrder(order),
    };
  }

  /**
   * 后台查看订单收据
   */
  async getAdminReceipt(orderId: string): Promise<Receipt & { items: OrderItem[] }> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const receiptRecord = await this.findReceiptByOrderId(orderId);
    if (!receiptRecord) {
      throw new NotFoundException('Receipt not found');
    }

    const items = await this.getOrderItems(orderId);
    return {
      ...this.mapReceipt(receiptRecord, order),
      items,
      order: this.mapOrder(order),
    };
  }

  /**
   * 用户收据列表
   */
  async getUserReceiptList(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<Receipt>> {
    const appUserId = await this.resolveAppUserId(userId);
    const p = Math.max(1, page);
    const ps = Math.min(50, Math.max(1, pageSize));

    const countResult = await this.db
      .select({ count: count() })
      .from(receipt)
      .where(eq(receipt.userId, appUserId));
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select()
      .from(receipt)
      .leftJoin(appOrder, eq(receipt.orderId, appOrder.id))
      .where(eq(receipt.userId, appUserId))
      .orderBy(desc(receipt.issuedAt))
      .limit(ps)
      .offset((p - 1) * ps);

    const items: Receipt[] = rows.map(({ receipt: r, app_order: o }) => ({
      id: r.id,
      receiptNo: r.receiptNo,
      orderId: r.orderId,
      orderNo: o?.orderNo ?? '',
      userId: r.userId,
      amount: Number(r.amount ?? 0),
      paymentMethod: r.paymentMethod ?? '',
      issuedAt: r.issuedAt.toISOString(),
    }));

    return { items, total, page: p, pageSize: ps };
  }

  /**
   * 生成收据编号：REC + 年月日 + 6位序号
   */
  private async generateReceiptNo(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const datePrefix = `REC${y}${m}${d}`;

    // 查询当日最大序号
    const likePattern = `${datePrefix}%`;
    const result = await this.db
      .select({ receiptNo: receipt.receiptNo })
      .from(receipt)
      .where(sql`${receipt.receiptNo} LIKE ${likePattern}`)
      .orderBy(desc(receipt.receiptNo))
      .limit(1);

    let seq = 1;
    if (result.length > 0 && result[0].receiptNo) {
      const seqStr = result[0].receiptNo.slice(datePrefix.length);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }

    return `${datePrefix}${String(seq).padStart(6, '0')}`;
  }

  // ===== 私有方法 =====

  private async resolveAppUserId(userId: string): Promise<string> {
    const rows = await this.db
      .select({ id: appUser.id })
      .from(appUser)
      .where(eq(appUser.userId, userId))
      .limit(1);
    if (rows.length > 0) return rows[0].id;
    const inserted = await this.db
      .insert(appUser)
      .values({ userId, nickname: '會員', status: 'active', totalConsumption: '0' })
      .returning({ id: appUser.id });
    return inserted[0].id;
  }

  private async findOrderById(orderId: string): Promise<OrderRecord | undefined> {
    const rows = await this.db
      .select()
      .from(appOrder)
      .where(eq(appOrder.id, orderId))
      .limit(1);
    return rows[0];
  }

  private async findReceiptByOrderId(orderId: string): Promise<ReceiptRecord | undefined> {
    const rows = await this.db
      .select()
      .from(receipt)
      .where(eq(receipt.orderId, orderId))
      .limit(1);
    return rows[0];
  }

  private async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const rows = await this.db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, orderId))
      .orderBy(orderItem.createdAt);
    return rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      productId: row.productId,
      productTitleZh: row.productTitleZh,
      productTitleEn: row.productTitleEn,
      productImageUrl: row.productImageUrl ?? '',
      spec: (row.spec as Record<string, string>) ?? {},
      quantity: row.quantity,
      originalPrice: Number(row.originalPrice ?? 0),
      salePrice: Number(row.salePrice ?? 0),
      subtotal: Number(row.subtotal ?? 0),
    }));
  }

  private mapReceipt(row: ReceiptRecord, order?: OrderRecord): Receipt {
    return {
      id: row.id,
      receiptNo: row.receiptNo,
      orderId: row.orderId,
      orderNo: order?.orderNo ?? '',
      userId: row.userId,
      amount: Number(row.amount ?? 0),
      paymentMethod: row.paymentMethod ?? '',
      issuedAt: row.issuedAt.toISOString(),
    };
  }

  private mapOrder(row: OrderRecord) {
    return {
      id: row.id,
      orderNo: row.orderNo,
      userId: row.userId,
      addressId: row.addressId ?? '',
      totalAmount: Number(row.totalAmount ?? 0),
      discountAmount: Number(row.discountAmount ?? 0),
      shippingFee: Number(row.shippingFee ?? 0),
      payAmount: Number(row.payAmount ?? 0),
      paymentMethod: row.paymentMethod ?? '',
      paymentStatus: row.paymentStatus,
      orderStatus: row.orderStatus,
      shippingNo: row.shippingNo ?? '',
      shippingCompany: row.shippingCompany ?? '',
      remark: row.remark ?? '',
      paidAt: row.paidAt ? row.paidAt.toISOString() : '',
      createdAt: row.createdAt.toISOString(),
    };
  }
}
