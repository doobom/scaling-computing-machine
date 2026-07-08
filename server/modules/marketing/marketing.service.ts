import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, asc, sql, count, like, or, lte, gte } from 'drizzle-orm';
import { discount, promotion, banner } from '@server/database/schema';

export interface DiscountFormData {
  nameZh: string;
  nameEn: string;
  discountRate: string;
  startTime: Date;
  endTime: Date;
  applicableScope: string;
  applicableIds: string[];
  status: string;
  sort: number;
}

export interface PromotionFormData {
  nameZh: string;
  nameEn: string;
  thresholdAmount: string;
  discountAmount: string;
  startTime: Date;
  endTime: Date;
  applicableScope: string;
  applicableIds: string[];
  allowStack: boolean;
  status: string;
  sort: number;
}

export interface BannerFormData {
  imageUrl: string;
  titleZh?: string;
  titleEn?: string;
  subtitleZh?: string;
  subtitleEn?: string;
  jumpUrl?: string;
  sort: number;
  status: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

type DiscountRecord = typeof discount.$inferSelect;
type PromotionRecord = typeof promotion.$inferSelect;
type BannerRecord = typeof banner.$inferSelect;

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ==================== Banner (Storefront) ====================

  async getEnabledBanners(): Promise<BannerRecord[]> {
    this.logger.log('getEnabledBanners');
    const banners: BannerRecord[] = await this.db
      .select()
      .from(banner)
      .where(eq(banner.status, 'enabled'))
      .orderBy(asc(banner.sort), desc(banner.createdAt));
    return banners;
  }

  // ==================== Discount (Storefront) ====================

  async getActiveDiscounts(): Promise<DiscountRecord[]> {
    this.logger.log('getActiveDiscounts');
    const now = new Date();
    const discounts: DiscountRecord[] = await this.db
      .select()
      .from(discount)
      .where(
        and(
          eq(discount.status, 'active'),
          lte(discount.startTime, now),
          gte(discount.endTime, now),
        ),
      )
      .orderBy(asc(discount.sort), desc(discount.createdAt));
    return discounts;
  }

  // ==================== Discount (Admin) ====================

  async getDiscountList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: string;
  }): Promise<PaginatedResult<DiscountRecord>> {
    const { page, pageSize, keyword, status } = params;
    this.logger.log(`getDiscountList: page=${page}, pageSize=${pageSize}`);

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          like(discount.nameZh, `%${keyword}%`),
          like(discount.nameEn, `%${keyword}%`),
        ),
      );
    }
    if (status) {
      conditions.push(eq(discount.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(discount)
        .where(whereClause),
      this.db
        .select()
        .from(discount)
        .where(whereClause)
        .orderBy(desc(discount.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  }

  async getDiscountById(id: string): Promise<DiscountRecord> {
    this.logger.log(`getDiscountById: ${id}`);
    const [record]: DiscountRecord[] = await this.db
      .select()
      .from(discount)
      .where(eq(discount.id, id))
      .limit(1);
    if (!record) {
      throw new NotFoundException('Discount not found');
    }
    return record;
  }

  async createDiscount(data: DiscountFormData): Promise<DiscountRecord> {
    this.logger.log(`createDiscount: ${data.nameZh}`);
    const [created]: DiscountRecord[] = await this.db
      .insert(discount)
      .values(data)
      .returning();
    return created;
  }

  async updateDiscount(id: string, data: DiscountFormData): Promise<DiscountRecord> {
    this.logger.log(`updateDiscount: ${id}`);
    const [updated]: DiscountRecord[] = await this.db
      .update(discount)
      .set(data)
      .where(eq(discount.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Discount not found');
    }
    return updated;
  }

  async deleteDiscount(id: string): Promise<void> {
    this.logger.log(`deleteDiscount: ${id}`);
    const deleted: DiscountRecord[] = await this.db
      .delete(discount)
      .where(eq(discount.id, id))
      .returning();
    if (deleted.length === 0) {
      throw new NotFoundException('Discount not found');
    }
  }

  async updateDiscountStatus(id: string, status: string): Promise<DiscountRecord> {
    this.logger.log(`updateDiscountStatus: ${id}, status=${status}`);
    const [updated]: DiscountRecord[] = await this.db
      .update(discount)
      .set({ status })
      .where(eq(discount.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Discount not found');
    }
    return updated;
  }

  // ==================== Promotion (Admin) ====================

  async getPromotionList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: string;
  }): Promise<PaginatedResult<PromotionRecord>> {
    const { page, pageSize, keyword, status } = params;
    this.logger.log(`getPromotionList: page=${page}, pageSize=${pageSize}`);

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          like(promotion.nameZh, `%${keyword}%`),
          like(promotion.nameEn, `%${keyword}%`),
        ),
      );
    }
    if (status) {
      conditions.push(eq(promotion.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(promotion)
        .where(whereClause),
      this.db
        .select()
        .from(promotion)
        .where(whereClause)
        .orderBy(desc(promotion.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  }

  async getPromotionById(id: string): Promise<PromotionRecord> {
    this.logger.log(`getPromotionById: ${id}`);
    const [record]: PromotionRecord[] = await this.db
      .select()
      .from(promotion)
      .where(eq(promotion.id, id))
      .limit(1);
    if (!record) {
      throw new NotFoundException('Promotion not found');
    }
    return record;
  }

  async createPromotion(data: PromotionFormData): Promise<PromotionRecord> {
    this.logger.log(`createPromotion: ${data.nameZh}`);
    const [created]: PromotionRecord[] = await this.db
      .insert(promotion)
      .values(data)
      .returning();
    return created;
  }

  async updatePromotion(id: string, data: PromotionFormData): Promise<PromotionRecord> {
    this.logger.log(`updatePromotion: ${id}`);
    const [updated]: PromotionRecord[] = await this.db
      .update(promotion)
      .set(data)
      .where(eq(promotion.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Promotion not found');
    }
    return updated;
  }

  async deletePromotion(id: string): Promise<void> {
    this.logger.log(`deletePromotion: ${id}`);
    const deleted: PromotionRecord[] = await this.db
      .delete(promotion)
      .where(eq(promotion.id, id))
      .returning();
    if (deleted.length === 0) {
      throw new NotFoundException('Promotion not found');
    }
  }

  async updatePromotionStatus(id: string, status: string): Promise<PromotionRecord> {
    this.logger.log(`updatePromotionStatus: ${id}, status=${status}`);
    const [updated]: PromotionRecord[] = await this.db
      .update(promotion)
      .set({ status })
      .where(eq(promotion.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Promotion not found');
    }
    return updated;
  }

  // ==================== Banner (Admin) ====================

  async getBannerList(params: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResult<BannerRecord>> {
    const { page = 1, pageSize = 50, status } = params;
    this.logger.log(`getBannerList: page=${page}, pageSize=${pageSize}`);

    const whereClause = status ? eq(banner.status, status) : undefined;

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(banner)
        .where(whereClause),
      this.db
        .select()
        .from(banner)
        .where(whereClause)
        .orderBy(asc(banner.sort), desc(banner.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  }

  async createBanner(data: BannerFormData): Promise<BannerRecord> {
    this.logger.log(`createBanner: sort=${data.sort}`);
    const [created]: BannerRecord[] = await this.db
      .insert(banner)
      .values(data)
      .returning();
    return created;
  }

  async updateBanner(id: string, data: BannerFormData): Promise<BannerRecord> {
    this.logger.log(`updateBanner: ${id}`);
    const [updated]: BannerRecord[] = await this.db
      .update(banner)
      .set(data)
      .where(eq(banner.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Banner not found');
    }
    return updated;
  }

  async deleteBanner(id: string): Promise<void> {
    this.logger.log(`deleteBanner: ${id}`);
    const deleted: BannerRecord[] = await this.db
      .delete(banner)
      .where(eq(banner.id, id))
      .returning();
    if (deleted.length === 0) {
      throw new NotFoundException('Banner not found');
    }
  }

  async updateBannerStatus(id: string, status: string): Promise<BannerRecord> {
    this.logger.log(`updateBannerStatus: ${id}, status=${status}`);
    const [updated]: BannerRecord[] = await this.db
      .update(banner)
      .set({ status })
      .where(eq(banner.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Banner not found');
    }
    return updated;
  }
}
