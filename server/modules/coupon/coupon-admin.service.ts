import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc, count, like, or } from 'drizzle-orm';
import { coupon } from '@server/database/schema';
import { CouponService } from './coupon.service';
import { mapCoupon } from './coupon.mapper';
import type { Coupon, CouponListParams, PaginatedResponse } from '@shared/api.interface';

interface CouponCreateInput {
  nameZh: string;
  nameEn: string;
  type: string;
  discountValue: string;
  minAmount: string;
  applicableScope: string;
  applicableIds: string[];
  validType: string;
  validDays: number | null;
  startTime: Date | null;
  endTime: Date | null;
  totalQuantity: number;
  usedQuantity: number;
  perUserLimit: number;
  status: string;
  sort: number;
}

@Injectable()
export class CouponAdminService extends CouponService {
  // ==================== Admin: List ====================

  async getAdminList(
    params: CouponListParams,
  ): Promise<PaginatedResponse<Coupon>> {
    const { page, pageSize, keyword, status, type } = params;
    this.logger.log(
      `getAdminList: page=${page}, pageSize=${pageSize}, status=${status}, type=${type}`,
    );

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          like(coupon.nameZh, `%${keyword}%`),
          like(coupon.nameEn, `%${keyword}%`),
        ),
      );
    }
    if (status) conditions.push(eq(coupon.status, status));
    if (type) conditions.push(eq(coupon.type, type));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(coupon).where(whereClause),
      this.db
        .select()
        .from(coupon)
        .where(whereClause)
        .orderBy(desc(coupon.createdAt))
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

  // ==================== Admin: Detail ====================

  async getAdminDetail(id: string): Promise<Coupon> {
    this.logger.log(`getAdminDetail: ${id}`);
    const [row] = await this.db
      .select()
      .from(coupon)
      .where(eq(coupon.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Coupon not found');
    return this.mapCoupon(row);
  }

  // ==================== Admin: Create ====================

  async createCoupon(dto: Partial<Coupon>): Promise<Coupon> {
    this.logger.log(`createCoupon: ${dto.nameZh}`);
    const values: CouponCreateInput = {
      nameZh: dto.nameZh ?? '',
      nameEn: dto.nameEn ?? '',
      type: dto.type ?? 'fixed',
      discountValue: dto.discountValue?.toString() ?? '0',
      minAmount: dto.minAmount?.toString() ?? '0',
      applicableScope: dto.applicableScope ?? 'all',
      applicableIds: dto.applicableIds ?? [],
      validType: dto.validType ?? 'fixed',
      validDays: dto.validDays ?? null,
      startTime: dto.startTime ? new Date(dto.startTime) : null,
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      totalQuantity: dto.totalQuantity ?? 0,
      usedQuantity: 0,
      perUserLimit: dto.perUserLimit ?? 1,
      status: dto.status ?? 'active',
      sort: dto.sort ?? 0,
    };
    const [inserted] = await this.db.insert(coupon).values(values).returning();
    return this.mapCoupon(inserted);
  }

  // ==================== Admin: Update ====================

  async updateCoupon(id: string, dto: Partial<Coupon>): Promise<Coupon> {
    this.logger.log(`updateCoupon: ${id}`);
    const values: Partial<CouponCreateInput> = {};
    if (dto.nameZh !== undefined) values.nameZh = dto.nameZh;
    if (dto.nameEn !== undefined) values.nameEn = dto.nameEn;
    if (dto.type !== undefined) values.type = dto.type;
    if (dto.discountValue !== undefined)
      values.discountValue = dto.discountValue.toString();
    if (dto.minAmount !== undefined) values.minAmount = dto.minAmount.toString();
    if (dto.applicableScope !== undefined)
      values.applicableScope = dto.applicableScope;
    if (dto.applicableIds !== undefined) values.applicableIds = dto.applicableIds;
    if (dto.validType !== undefined) values.validType = dto.validType;
    if (dto.validDays !== undefined) values.validDays = dto.validDays;
    if (dto.startTime !== undefined)
      values.startTime = dto.startTime ? new Date(dto.startTime) : null;
    if (dto.endTime !== undefined)
      values.endTime = dto.endTime ? new Date(dto.endTime) : null;
    if (dto.totalQuantity !== undefined) values.totalQuantity = dto.totalQuantity;
    if (dto.perUserLimit !== undefined) values.perUserLimit = dto.perUserLimit;
    if (dto.status !== undefined) values.status = dto.status;
    if (dto.sort !== undefined) values.sort = dto.sort;

    const [updated] = await this.db
      .update(coupon)
      .set(values)
      .where(eq(coupon.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Coupon not found');
    return this.mapCoupon(updated);
  }

  // ==================== Admin: Toggle Status ====================

  async toggleStatus(id: string, status: string): Promise<Coupon> {
    this.logger.log(`toggleStatus: ${id}, status=${status}`);
    const [updated] = await this.db
      .update(coupon)
      .set({ status })
      .where(eq(coupon.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Coupon not found');
    return this.mapCoupon(updated);
  }
}
