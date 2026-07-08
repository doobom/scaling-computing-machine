import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, asc, ilike, or, count, inArray } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  appUser,
  memberLevel,
  favorite,
  appOrder,
  orderItem,
  product,
} from '@server/database/schema';

export interface MemberProfile {
  id: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalConsumption: string;
  status: string;
  memberLevel: {
    id: string;
    nameZh: string;
    nameEn: string;
    minConsumption: string;
    discountRate: string;
    iconUrl: string | null;
  } | null;
  nextLevel: {
    id: string;
    nameZh: string;
    nameEn: string;
    minConsumption: string;
  } | null;
  upgradeProgress: number;
}

export interface OrderWithItems {
  id: string;
  orderNo: string;
  userId: string;
  totalAmount: string;
  discountAmount: string;
  shippingFee: string;
  payAmount: string;
  paymentStatus: string;
  paymentMethod: string | null;
  orderStatus: string;
  shippingNo: string | null;
  shippingCompany: string | null;
  remark: string | null;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  items: Array<{
    id: string;
    productId: string;
    productTitleZh: string;
    productTitleEn: string;
    productImageUrl: string | null;
    quantity: number;
    originalPrice: string;
    salePrice: string;
    subtotal: string;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ==================== 前台会员 ====================

  async getOrCreateAppUser(userId: string): Promise<typeof appUser.$inferSelect> {
    const existing = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.userId, userId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const defaultLevel = await this.db
      .select()
      .from(memberLevel)
      .where(eq(memberLevel.status, 'active'))
      .orderBy(asc(memberLevel.minConsumption))
      .limit(1);

    const inserted = await this.db
      .insert(appUser)
      .values({
        userId,
        nickname: '會員',
        memberLevelId: defaultLevel[0]?.id,
        totalConsumption: '0',
        status: 'active',
      })
      .returning();

    return inserted[0];
  }

  async getProfile(userId: string): Promise<MemberProfile> {
    const user = await this.getOrCreateAppUser(userId);

    let level: typeof memberLevel.$inferSelect | null = null;
    if (user.memberLevelId) {
      const levels = await this.db
        .select()
        .from(memberLevel)
        .where(eq(memberLevel.id, user.memberLevelId))
        .limit(1);
      level = levels[0] || null;
    }

    const allLevels = await this.db
      .select()
      .from(memberLevel)
      .where(eq(memberLevel.status, 'active'))
      .orderBy(asc(memberLevel.minConsumption));

    const currentMin = level ? Number(level.minConsumption) : 0;
    const nextLevelObj = allLevels.find(
      (l) => Number(l.minConsumption) > currentMin,
    ) || null;

    const total = Number(user.totalConsumption);
    const nextMin = nextLevelObj ? Number(nextLevelObj.minConsumption) : currentMin;
    const progress = nextMin > currentMin
      ? Math.min(100, Math.round(((total - currentMin) / (nextMin - currentMin)) * 100))
      : 100;

    return {
      id: user.id,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      totalConsumption: user.totalConsumption,
      status: user.status,
      memberLevel: level
        ? {
            id: level.id,
            nameZh: level.nameZh,
            nameEn: level.nameEn,
            minConsumption: level.minConsumption,
            discountRate: level.discountRate,
            iconUrl: level.iconUrl,
          }
        : null,
      nextLevel: nextLevelObj
        ? {
            id: nextLevelObj.id,
            nameZh: nextLevelObj.nameZh,
            nameEn: nextLevelObj.nameEn,
            minConsumption: nextLevelObj.minConsumption,
          }
        : null,
      upgradeProgress: progress,
    };
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; phone?: string; email?: string },
  ): Promise<MemberProfile> {
    const user = await this.getOrCreateAppUser(userId);
    await this.db
      .update(appUser)
      .set({
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
      })
      .where(eq(appUser.id, user.id));

    return this.getProfile(userId);
  }

  async getMyOrders(
    userId: string,
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<PaginatedResult<OrderWithItems>> {
    const user = await this.getOrCreateAppUser(userId);
    const offset = (page - 1) * pageSize;

    const whereConditions = [eq(appOrder.userId, user.id)];
    if (status) {
      whereConditions.push(eq(appOrder.orderStatus, status));
    }

    const [countResult, orders] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(appOrder)
        .where(and(...whereConditions)),
      this.db
        .select()
        .from(appOrder)
        .where(and(...whereConditions))
        .orderBy(desc(appOrder.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const orderIds = orders.map((o) => o.id);
    let allItems: typeof orderItem.$inferSelect[] = [];
    if (orderIds.length > 0) {
      allItems = await this.db
        .select()
        .from(orderItem)
        .where(inArray(orderItem.orderId, orderIds));
    }

    const itemsByOrder = new Map<string, typeof orderItem.$inferSelect[]>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const result: OrderWithItems[] = orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      payAmount: order.payAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus,
      shippingNo: order.shippingNo,
      shippingCompany: order.shippingCompany,
      remark: order.remark,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      completedAt: order.completedAt,
      items: (itemsByOrder.get(order.id) || []).map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitleZh: item.productTitleZh,
        productTitleEn: item.productTitleEn,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
        subtotal: item.subtotal,
      })),
    }));

    return {
      items: result,
      total: Number(countResult[0].count),
      page,
      pageSize,
    };
  }

  async getOrderDetail(userId: string, orderId: string): Promise<OrderWithItems> {
    const user = await this.getOrCreateAppUser(userId);

    const orders = await this.db
      .select()
      .from(appOrder)
      .where(and(eq(appOrder.id, orderId), eq(appOrder.userId, user.id)))
      .limit(1);

    if (orders.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orders[0];
    const items = await this.db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, order.id));

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      payAmount: order.payAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus,
      shippingNo: order.shippingNo,
      shippingCompany: order.shippingCompany,
      remark: order.remark,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      completedAt: order.completedAt,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitleZh: item.productTitleZh,
        productTitleEn: item.productTitleEn,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
        subtotal: item.subtotal,
      })),
    };
  }

  // ==================== 收藏 ====================

  async getFavorites(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<
    PaginatedResult<{
      id: string;
      productId: string;
      createdAt: Date;
      product: {
        id: string;
        titleZh: string;
        titleEn: string;
        salePrice: string;
        originalPrice: string;
        imageUrl: string | null;
      } | null;
    }>
  > {
    const user = await this.getOrCreateAppUser(userId);
    const offset = (page - 1) * pageSize;

    const [countResult, favs] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(favorite)
        .where(eq(favorite.userId, user.id)),
      this.db
        .select()
        .from(favorite)
        .where(eq(favorite.userId, user.id))
        .orderBy(desc(favorite.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const productIds = favs.map((f) => f.productId);
    const products = productIds.length > 0
      ? await this.db.select().from(product).where(inArray(product.id, productIds))
      : [];

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = favs.map((fav) => {
      const p = productMap.get(fav.productId);
      return {
        id: fav.id,
        productId: fav.productId,
        createdAt: fav.createdAt,
        product: p
          ? {
              id: p.id,
              titleZh: p.titleZh,
              titleEn: p.titleEn,
              salePrice: p.salePrice,
              originalPrice: p.originalPrice,
              imageUrl: null,
            }
          : null,
      };
    });

    return {
      items,
      total: Number(countResult[0].count),
      page,
      pageSize,
    };
  }

  async addFavorite(userId: string, productId: string): Promise<void> {
    const user = await this.getOrCreateAppUser(userId);

    const existing = await this.db
      .select()
      .from(favorite)
      .where(and(eq(favorite.userId, user.id), eq(favorite.productId, productId)))
      .limit(1);

    if (existing.length > 0) return;

    await this.db.insert(favorite).values({
      userId: user.id,
      productId,
    });
  }

  async removeFavorite(userId: string, productId: string): Promise<void> {
    const user = await this.getOrCreateAppUser(userId);
    await this.db
      .delete(favorite)
      .where(and(eq(favorite.userId, user.id), eq(favorite.productId, productId)));
  }

  // ==================== 后台会员管理 ====================

  async getAdminMembers(
    page: number,
    pageSize: number,
    keyword?: string,
    status?: string,
  ): Promise<
    PaginatedResult<
      typeof appUser.$inferSelect & {
        memberLevel: typeof memberLevel.$inferSelect | null;
      }
    >
  > {
    const offset = (page - 1) * pageSize;
    const conditions = [];

    if (keyword) {
      conditions.push(
        or(
          ilike(appUser.nickname, `%${keyword}%`),
          ilike(appUser.phone, `%${keyword}%`),
          ilike(appUser.email, `%${keyword}%`),
        ),
      );
    }
    if (status) {
      conditions.push(eq(appUser.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countQuery = whereClause
      ? this.db.select({ count: count() }).from(appUser).where(whereClause)
      : this.db.select({ count: count() }).from(appUser);

    const dataQuery = whereClause
      ? this.db
          .select()
          .from(appUser)
          .where(whereClause)
          .orderBy(desc(appUser.createdAt))
          .limit(pageSize)
          .offset(offset)
      : this.db
          .select()
          .from(appUser)
          .orderBy(desc(appUser.createdAt))
          .limit(pageSize)
          .offset(offset);

    const [countResult, users] = await Promise.all([countQuery, dataQuery]);

    const levelIds = users
      .map((u) => u.memberLevelId)
      .filter((id): id is string => !!id);
    const levels = levelIds.length > 0
      ? await this.db.select().from(memberLevel).where(inArray(memberLevel.id, levelIds))
      : [];
    const levelMap = new Map(levels.map((l) => [l.id, l]));

    const items = users.map((user) => ({
      ...user,
      memberLevel: user.memberLevelId ? levelMap.get(user.memberLevelId) || null : null,
    }));

    return {
      items,
      total: Number(countResult[0].count),
      page,
      pageSize,
    };
  }

  async getAdminMemberDetail(id: string): Promise<{
    user: typeof appUser.$inferSelect;
    memberLevel: typeof memberLevel.$inferSelect | null;
    orderCount: number;
    orderTotal: string;
  }> {
    const users = await this.db.select().from(appUser).where(eq(appUser.id, id)).limit(1);
    if (users.length === 0) throw new NotFoundException('Member not found');

    const user = users[0];
    let level: typeof memberLevel.$inferSelect | null = null;
    if (user.memberLevelId) {
      const levelResult = await this.db
        .select()
        .from(memberLevel)
        .where(eq(memberLevel.id, user.memberLevelId))
        .limit(1);
      level = levelResult[0] || null;
    }

    const orderStats = await this.db
      .select({
        count: count(),
      })
      .from(appOrder)
      .where(eq(appOrder.userId, user.id));

    return {
      user,
      memberLevel: level,
      orderCount: Number(orderStats[0].count),
      orderTotal: user.totalConsumption,
    };
  }

  async updateMemberStatus(id: string, status: string): Promise<void> {
    const users = await this.db.select().from(appUser).where(eq(appUser.id, id)).limit(1);
    if (users.length === 0) throw new NotFoundException('Member not found');

    await this.db.update(appUser).set({ status }).where(eq(appUser.id, id));
  }

  async updateMemberLevel(id: string, memberLevelId: string): Promise<void> {
    const [users, levels] = await Promise.all([
      this.db.select().from(appUser).where(eq(appUser.id, id)).limit(1),
      this.db.select().from(memberLevel).where(eq(memberLevel.id, memberLevelId)).limit(1),
    ]);
    if (users.length === 0) throw new NotFoundException('Member not found');
    if (levels.length === 0) throw new BadRequestException('Invalid member level');

    await this.db
      .update(appUser)
      .set({ memberLevelId })
      .where(eq(appUser.id, id));
  }

  // ==================== 会员等级管理 ====================

  async getMemberLevels(): Promise<typeof memberLevel.$inferSelect[]> {
    return this.db
      .select()
      .from(memberLevel)
      .orderBy(asc(memberLevel.minConsumption));
  }

  async createMemberLevel(data: {
    nameZh: string;
    nameEn: string;
    minConsumption: string;
    discountRate: string;
    iconUrl?: string;
    sort?: number;
  }): Promise<typeof memberLevel.$inferSelect> {
    const inserted = await this.db
      .insert(memberLevel)
      .values({
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        minConsumption: data.minConsumption,
        discountRate: data.discountRate,
        iconUrl: data.iconUrl,
        sort: data.sort ?? 0,
        status: 'active',
      })
      .returning();
    return inserted[0];
  }

  async updateMemberLevelInfo(
    id: string,
    data: {
      nameZh?: string;
      nameEn?: string;
      minConsumption?: string;
      discountRate?: string;
      iconUrl?: string;
      sort?: number;
      status?: string;
    },
  ): Promise<typeof memberLevel.$inferSelect> {
    const existing = await this.db
      .select()
      .from(memberLevel)
      .where(eq(memberLevel.id, id))
      .limit(1);
    if (existing.length === 0) throw new NotFoundException('Member level not found');

    const updated = await this.db
      .update(memberLevel)
      .set(data)
      .where(eq(memberLevel.id, id))
      .returning();
    return updated[0];
  }

  async deleteMemberLevel(id: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(memberLevel)
      .where(eq(memberLevel.id, id))
      .limit(1);
    if (existing.length === 0) throw new NotFoundException('Member level not found');

    // Check if any user is using this level
    const userCount = await this.db
      .select({ count: count() })
      .from(appUser)
      .where(eq(appUser.memberLevelId, id));

    if (Number(userCount[0].count) > 0) {
      throw new BadRequestException('Cannot delete level with active members');
    }

    await this.db.delete(memberLevel).where(eq(memberLevel.id, id));
  }
}
