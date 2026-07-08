import type { coupon, userCoupon } from '@server/database/schema';
import type { Coupon, UserCoupon } from '@shared/api.interface';

export type CouponRow = typeof coupon.$inferSelect;
export type UserCouponRow = typeof userCoupon.$inferSelect;

export function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    nameZh: row.nameZh,
    nameEn: row.nameEn,
    type: row.type as Coupon['type'],
    discountValue: Number(row.discountValue ?? 0),
    minAmount: Number(row.minAmount ?? 0),
    applicableScope: row.applicableScope as Coupon['applicableScope'],
    applicableIds: (row.applicableIds as string[]) ?? [],
    validType: row.validType as Coupon['validType'],
    validDays: row.validDays ?? undefined,
    startTime: row.startTime ? row.startTime.toISOString() : undefined,
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    totalQuantity: row.totalQuantity,
    usedQuantity: row.usedQuantity,
    perUserLimit: row.perUserLimit,
    status: row.status,
    sort: row.sort,
  };
}

export function mapUserCoupon(
  row: UserCouponRow,
  couponData?: Coupon,
): UserCoupon {
  return {
    id: row.id,
    userId: row.userId,
    couponId: row.couponId,
    coupon: couponData,
    status: row.status as UserCoupon['status'],
    usedOrderId: row.usedOrderId ?? undefined,
    usedTime: row.usedTime ? row.usedTime.toISOString() : undefined,
    expireTime: row.expireTime ? row.expireTime.toISOString() : undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}
