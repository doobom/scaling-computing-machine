import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, asc, sql, count, or, lte, gte, lt } from 'drizzle-orm';
import { coupon, userCoupon, appUser } from '@server/database/schema';
import type { Coupon, UserCoupon, PaginatedResponse } from '@shared/api.interface';
import { mapCoupon, mapUserCoupon } from './coupon.mapper';
import type { CouponRow, UserCouponRow } from './coupon.mapper';

@Injectable()
export class CouponService {
  protected readonly logger = new Logger(CouponService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) protected readonly db: PostgresJsDatabase,
  ) {}

  // ==================== User ID Resolution ====================

  protected async resolveAppUserId(userId: string): Promise<string> {
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

  // ==================== Storefront: Available Coupons ====================

  async getAvailableCoupons(
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<Coupon>> {
    this.logger.log(`getAvailableCoupons: page=${page}, pageSize=${pageSize}`);
    const now = new Date();

    const conditions = [
      eq(coupon.status, 'active'),
      lt(coupon.usedQuantity, coupon.totalQuantity),
      or(
        and(
          eq(coupon.validType, 'fixed'),
          lte(coupon.startTime, now),
          gte(coupon.endTime, now),
        ),
        eq(coupon.validType, 'days'),
      ),
    ];

    const whereClause = and(...conditions);

    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(coupon).where(whereClause),
      this.db
        .select()
        .from(coupon)
        .where(whereClause)
        .orderBy(asc(coupon.sort), desc(coupon.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return {
      items: items.map((row) => this.mapCoupon(row)),
      total,
      page,
      pageSize,
    };
  }

  // ==================== Storefront: Claim Coupon ====================

  async claimCoupon(userId: string, couponId: string): Promise<UserCoupon> {
    this.logger.log(`claimCoupon: userId=${userId}, couponId=${couponId}`);
    const appUserId = await this.resolveAppUserId(userId);
    const now = new Date();

    const [couponRow] = await this.db
      .select()
      .from(coupon)
      .where(eq(coupon.id, couponId))
      .limit(1);
    if (!couponRow) throw new NotFoundException('Coupon not found');
    if (couponRow.status !== 'active') throw new BadRequestException('Coupon is not active');
    if (couponRow.validType === 'fixed') {
      if (!couponRow.startTime || !couponRow.endTime) {
        throw new BadRequestException('Coupon validity not configured');
      }
      if (couponRow.startTime > now || couponRow.endTime < now) {
        throw new BadRequestException('Coupon is not within valid period');
      }
    }
    if (couponRow.usedQuantity >= couponRow.totalQuantity) {
      throw new BadRequestException('Coupon is out of stock');
    }

    const [claimedCount] = await this.db
      .select({ count: count() })
      .from(userCoupon)
      .where(
        and(
          eq(userCoupon.userId, appUserId),
          eq(userCoupon.couponId, couponId),
        ),
      );
    if (Number(claimedCount.count ?? 0) >= couponRow.perUserLimit) {
      throw new BadRequestException('Coupon claim limit reached');
    }

    let expireTime: Date;
    if (couponRow.validType === 'fixed' && couponRow.endTime) {
      expireTime = couponRow.endTime;
    } else if (couponRow.validType === 'days' && couponRow.validDays) {
      expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + couponRow.validDays);
    } else {
      throw new BadRequestException('Coupon validity not configured');
    }

    const updated = await this.db
      .update(coupon)
      .set({ usedQuantity: sql`${coupon.usedQuantity} + 1` })
      .where(
        and(
          eq(coupon.id, couponId),
          lt(coupon.usedQuantity, coupon.totalQuantity),
        ),
      )
      .returning();
    if (updated.length === 0) throw new BadRequestException('Coupon is out of stock');

    const [inserted] = await this.db
      .insert(userCoupon)
      .values({ userId: appUserId, couponId, status: 'unused', expireTime })
      .returning();

    return this.mapUserCoupon(inserted, this.mapCoupon(couponRow));
  }

  // ==================== Storefront: My Coupons ====================

  async getUserCoupons(
    userId: string,
    status?: string,
  ): Promise<UserCoupon[]> {
    this.logger.log(`getUserCoupons: userId=${userId}, status=${status}`);
    const appUserId = await this.resolveAppUserId(userId);
    const now = new Date();

    const rows = await this.db
      .select()
      .from(userCoupon)
      .leftJoin(coupon, eq(userCoupon.couponId, coupon.id))
      .where(eq(userCoupon.userId, appUserId))
      .orderBy(desc(userCoupon.createdAt));

    const mapped = rows.map((row) => {
      const uc = row.user_coupon as UserCouponRow;
      const cp = row.coupon as CouponRow | null;
      const couponData = cp ? this.mapCoupon(cp) : undefined;
      let effectiveStatus: 'unused' | 'used' | 'expired' = uc.status as any;
      if (effectiveStatus === 'unused' && uc.expireTime && uc.expireTime < now) {
        effectiveStatus = 'expired';
      }
      return { ...this.mapUserCoupon(uc, couponData), status: effectiveStatus };
    });

    if (status) return mapped.filter((item) => item.status === status);
    return mapped;
  }

  // ==================== Storefront: Available for Checkout ====================

  async getUserAvailableCoupons(
    userId: string,
    amount: number,
    categoryIds?: string[],
    productIds?: string[],
  ): Promise<UserCoupon[]> {
    this.logger.log(`getUserAvailableCoupons: userId=${userId}, amount=${amount}`);
    const appUserId = await this.resolveAppUserId(userId);
    const now = new Date();

    const rows = await this.db
      .select()
      .from(userCoupon)
      .leftJoin(coupon, eq(userCoupon.couponId, coupon.id))
      .where(
        and(
          eq(userCoupon.userId, appUserId),
          eq(userCoupon.status, 'unused'),
          gte(userCoupon.expireTime, now),
        ),
      )
      .orderBy(desc(userCoupon.createdAt));

    const result: UserCoupon[] = [];
    for (const row of rows) {
      const uc = row.user_coupon as UserCouponRow;
      const cp = row.coupon as CouponRow | null;
      if (!cp || cp.status !== 'active') continue;

      const minAmount = Number(cp.minAmount ?? 0);
      if (amount < minAmount) continue;

      const scope = cp.applicableScope;
      if (scope === 'category') {
        const ids = cp.applicableIds as string[];
        if (!categoryIds || !categoryIds.some((c) => ids.includes(c))) continue;
      } else if (scope === 'product') {
        const ids = cp.applicableIds as string[];
        if (!productIds || !productIds.some((p) => ids.includes(p))) continue;
      }

      result.push(this.mapUserCoupon(uc, this.mapCoupon(cp)));
    }
    return result;
  }

  // ==================== Use / Return Coupon ====================

  async useCoupon(
    userId: string,
    userCouponId: string,
    orderId: string,
  ): Promise<UserCoupon> {
    this.logger.log(`useCoupon: userCouponId=${userCouponId}, orderId=${orderId}`);
    const appUserId = await this.resolveAppUserId(userId);

    const [existing] = await this.db
      .select()
      .from(userCoupon)
      .where(
        and(
          eq(userCoupon.id, userCouponId),
          eq(userCoupon.userId, appUserId),
        ),
      )
      .limit(1);
    if (!existing) throw new NotFoundException('User coupon not found');
    if (existing.status !== 'unused') throw new BadRequestException('Coupon is not unused');

    const [updated] = await this.db
      .update(userCoupon)
      .set({ status: 'used', usedOrderId: orderId, usedTime: new Date() })
      .where(eq(userCoupon.id, userCouponId))
      .returning();

    const [couponRow] = await this.db
      .select()
      .from(coupon)
      .where(eq(coupon.id, updated.couponId))
      .limit(1);

    return this.mapUserCoupon(
      updated,
      couponRow ? this.mapCoupon(couponRow) : undefined,
    );
  }

  async returnCoupon(userCouponId: string): Promise<void> {
    this.logger.log(`returnCoupon: userCouponId=${userCouponId}`);
    await this.db
      .update(userCoupon)
      .set({ status: 'unused', usedOrderId: null, usedTime: null })
      .where(eq(userCoupon.id, userCouponId));
  }

  protected readonly mapCoupon = mapCoupon;
  protected readonly mapUserCoupon = mapUserCoupon;
}
