import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from "@lark-apaas/fullstack-nestjs-core";
import { eq, and, sql, desc, asc, count } from 'drizzle-orm';
import { appOrder, orderItem, product, address, appUser } from '@server/database/schema';
import type {
  Order,
  OrderItem,
  OrderListParams,
  PaginatedResponse,
  CreateOrderResponse,
  CreateOrderItemInput,
} from '@shared/api.interface';
import { CartService } from './cart.service';
import { ProductService } from '../product/product.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly SHIPPING_FEE = 30;
  private readonly FREE_SHIPPING_THRESHOLD = 500;
  private readonly ORDER_EXPIRE_HOURS = 24;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
  ) {}

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

  private generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HK${y}${m}${d}${rand}`;
  }

  async createOrder(
    userId: string,
    items: CreateOrderItemInput[],
    addressId: string,
    paymentMethod: string,
    remark?: string,
  ): Promise<CreateOrderResponse> {
    if (!items || items.length === 0) {
      throw new BadRequestException('No items in order');
    }
    const appUserId = await this.resolveAppUserId(userId);

    const addrRows = await this.db
      .select()
      .from(address)
      .where(and(eq(address.id, addressId), eq(address.userId, appUserId)))
      .limit(1);
    if (addrRows.length === 0) {
      throw new BadRequestException('Invalid address');
    }

    const productIds = items.map((item) => item.productId);
    const productRows = await this.db
      .select()
      .from(product)
      .where(sql`${product.id} = ANY(ARRAY[${sql.join(productIds, sql`, `)}]::uuid[])`);

    const productMap = new Map<string, typeof productRows[0]>();
    for (const p of productRows) {
      productMap.set(p.id, p);
    }

    let totalAmount = 0;
    const orderItemsData: Array<{
      productId: string;
      productTitleZh: string;
      productTitleEn: string;
      productImageUrl: string;
      spec: Record<string, string>;
      quantity: number;
      originalPrice: number;
      salePrice: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }
      if (prod.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock: ${prod.titleZh}`);
      }
      const salePrice = Number(prod.salePrice ?? 0);
      const originalPrice = Number(prod.originalPrice ?? 0);
      const subtotal = salePrice * item.quantity;
      totalAmount += subtotal;
      orderItemsData.push({
        productId: prod.id,
        productTitleZh: prod.titleZh,
        productTitleEn: prod.titleEn,
        productImageUrl: '',
        spec: item.spec,
        quantity: item.quantity,
        originalPrice,
        salePrice,
        subtotal,
      });
    }

    const shippingFee = totalAmount >= this.FREE_SHIPPING_THRESHOLD ? 0 : this.SHIPPING_FEE;
    const discountAmount = 0;
    const payAmount = totalAmount - discountAmount + shippingFee;

    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + this.ORDER_EXPIRE_HOURS);

    const orderNo = this.generateOrderNo();

    const inserted = await this.db
      .insert(appOrder)
      .values({
        orderNo,
        userId: appUserId,
        addressId,
        totalAmount: totalAmount.toString(),
        discountAmount: discountAmount.toString(),
        shippingFee: shippingFee.toString(),
        payAmount: payAmount.toString(),
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending_pay',
        remark,
        expireTime,
      })
      .returning({ id: appOrder.id, orderNo: appOrder.orderNo, payAmount: appOrder.payAmount });

    const orderId = inserted[0].id;

    for (const item of orderItemsData) {
      await this.db.insert(orderItem).values({
        orderId,
        productId: item.productId,
        productTitleZh: item.productTitleZh,
        productTitleEn: item.productTitleEn,
        productImageUrl: item.productImageUrl,
        spec: item.spec,
        quantity: item.quantity,
        originalPrice: item.originalPrice.toString(),
        salePrice: item.salePrice.toString(),
        subtotal: item.subtotal.toString(),
      });

      await this.productService.decreaseStockWithVersion(
        item.productId,
        item.quantity,
      );
    }

    const cartIds = items.filter((i) => i.cartId).map((i) => i.cartId as string);
    if (cartIds.length > 0) {
      await this.cartService.removeCartItems(appUserId, cartIds);
    }

    return {
      orderId,
      orderNo: inserted[0].orderNo,
      payAmount: Number(inserted[0].payAmount ?? 0),
    };
  }

  async getOrderList(userId: string, params: OrderListParams): Promise<PaginatedResponse<Order>> {
    const appUserId = await this.resolveAppUserId(userId);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const conditions = [eq(appOrder.userId, appUserId)];
    if (params.status) {
      conditions.push(eq(appOrder.orderStatus, params.status));
    }

    const [countResult] = await this.db
      .select({ count: count() })
      .from(appOrder)
      .where(and(...conditions));

    const rows = await this.db
      .select()
      .from(appOrder)
      .where(and(...conditions))
      .orderBy(desc(appOrder.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = Number(countResult?.count ?? 0);

    return {
      items: rows.map((row) => this.mapOrder(row)),
      total,
      page,
      pageSize,
    };
  }

  async getOrderDetail(userId: string, id: string): Promise<Order & { items: OrderItem[] }> {
    const appUserId = await this.resolveAppUserId(userId);
    const orderRows = await this.db
      .select()
      .from(appOrder)
      .where(and(eq(appOrder.id, id), eq(appOrder.userId, appUserId)))
      .limit(1);
    if (orderRows.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const itemRows = await this.db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, id))
      .orderBy(orderItem.createdAt);

    const items: OrderItem[] = itemRows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      productId: row.productId,
      productTitleZh: row.productTitleZh,
      productTitleEn: row.productTitleEn,
      productImageUrl: row.productImageUrl ?? '',
      spec: row.spec as Record<string, string>,
      quantity: row.quantity,
      originalPrice: Number(row.originalPrice ?? 0),
      salePrice: Number(row.salePrice ?? 0),
      subtotal: Number(row.subtotal ?? 0),
    }));

    return { ...this.mapOrder(orderRows[0]), items };
  }

  async cancelOrder(userId: string, id: string): Promise<void> {
    const appUserId = await this.resolveAppUserId(userId);
    const orderRows = await this.db
      .select()
      .from(appOrder)
      .where(and(eq(appOrder.id, id), eq(appOrder.userId, appUserId)))
      .limit(1);
    if (orderRows.length === 0) {
      throw new NotFoundException('Order not found');
    }
    const order = orderRows[0];
    if (order.orderStatus !== 'pending_pay') {
      throw new BadRequestException('Order cannot be cancelled');
    }

    await this.db
      .update(appOrder)
      .set({ orderStatus: 'cancelled' })
      .where(eq(appOrder.id, id));

    const itemRows = await this.db.select().from(orderItem).where(eq(orderItem.orderId, id));
    for (const item of itemRows) {
      await this.productService.increaseStockWithVersion(
        item.productId,
        item.quantity,
      );
    }
  }

  private mapOrder(row: typeof appOrder.$inferSelect): Order {
    return {
      id: row.id,
      orderNo: row.orderNo,
      userId: row.userId,
      addressId: row.addressId,
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
      expireTime: row.expireTime ? row.expireTime.toISOString() : '',
      paidAt: row.paidAt ? row.paidAt.toISOString() : '',
      shippedAt: row.shippedAt ? row.shippedAt.toISOString() : '',
      completedAt: row.completedAt ? row.completedAt.toISOString() : '',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async adminGetOrderList(params: {
    keyword?: string;
    status?: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedResponse<Order & { userName?: string; userPhone?: string }>> {
    const page = params.page;
    const pageSize = params.pageSize;
    const conditions = [];
    if (params.status) conditions.push(eq(appOrder.orderStatus, params.status));

    const baseQuery = this.db
      .select({
        order: appOrder,
        nickname: appUser.nickname,
        phone: appUser.phone,
      })
      .from(appOrder)
      .leftJoin(appUser, eq(appOrder.userId, appUser.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const countResult = await this.db
      .select({ count: count() })
      .from(appOrder)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const rows = await baseQuery
      .orderBy(desc(appOrder.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      items: rows.map((row) => ({
        ...this.mapOrder(row.order),
        userName: row.nickname ?? '',
        userPhone: row.phone ?? '',
      })),
      total,
      page,
      pageSize,
    };
  }

  async adminGetOrderDetail(id: string): Promise<Order & { items: OrderItem[]; userName?: string; userPhone?: string }> {
    const orderRows = await this.db
      .select({
        order: appOrder,
        nickname: appUser.nickname,
        phone: appUser.phone,
      })
      .from(appOrder)
      .leftJoin(appUser, eq(appOrder.userId, appUser.id))
      .where(eq(appOrder.id, id))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const itemRows = await this.db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, id))
      .orderBy(orderItem.createdAt);

    const items: OrderItem[] = itemRows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      productId: row.productId,
      productTitleZh: row.productTitleZh,
      productTitleEn: row.productTitleEn,
      productImageUrl: row.productImageUrl ?? '',
      spec: row.spec as Record<string, string>,
      quantity: row.quantity,
      originalPrice: Number(row.originalPrice ?? 0),
      salePrice: Number(row.salePrice ?? 0),
      subtotal: Number(row.subtotal ?? 0),
    }));

    return {
      ...this.mapOrder(orderRows[0].order),
      items,
      userName: orderRows[0].nickname ?? '',
      userPhone: orderRows[0].phone ?? '',
    };
  }

  async adminUpdateShipping(id: string, shippingNo: string, shippingCompany: string): Promise<void> {
    const updated = await this.db
      .update(appOrder)
      .set({
        shippingNo,
        shippingCompany,
        orderStatus: 'shipped',
        shippedAt: new Date(),
      })
      .where(eq(appOrder.id, id))
      .returning({ id: appOrder.id });
    if (updated.length === 0) {
      throw new NotFoundException('Order not found');
    }
  }

  async adminUpdatePrice(id: string, payAmount: number): Promise<void> {
    const updated = await this.db
      .update(appOrder)
      .set({ payAmount: payAmount.toString() })
      .where(eq(appOrder.id, id))
      .returning({ id: appOrder.id });
    if (updated.length === 0) {
      throw new NotFoundException('Order not found');
    }
  }

  async adminCloseOrder(id: string, reason?: string): Promise<void> {
    const orderRows = await this.db.select().from(appOrder).where(eq(appOrder.id, id)).limit(1);
    if (orderRows.length === 0) {
      throw new NotFoundException('Order not found');
    }
    const order = orderRows[0];

    await this.db
      .update(appOrder)
      .set({ orderStatus: 'cancelled' })
      .where(eq(appOrder.id, id));

    if (order.orderStatus === 'pending_pay' || order.orderStatus === 'pending_ship') {
      const itemRows = await this.db.select().from(orderItem).where(eq(orderItem.orderId, id));
      for (const item of itemRows) {
        await this.productService.increaseStockWithVersion(
          item.productId,
          item.quantity,
        );
      }
    }
  }

  async adminUpdateRemark(id: string, remark: string): Promise<void> {
    const updated = await this.db
      .update(appOrder)
      .set({ remark })
      .where(eq(appOrder.id, id))
      .returning({ id: appOrder.id });
    if (updated.length === 0) {
      throw new NotFoundException('Order not found');
    }
  }
}
