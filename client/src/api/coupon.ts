import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Coupon, UserCoupon } from '@shared/api.interface';

export async function getAvailableCoupons(
  page = 1,
  pageSize = 20,
): Promise<{ items: Coupon[]; total: number }> {
  try {
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('pageSize', String(pageSize));
    const res = await axiosForBackend({
      url: `/api/coupons/available?${search.toString()}`,
      method: 'GET',
    });
    return res.data as { items: Coupon[]; total: number };
  } catch (err) {
    logger.error('getAvailableCoupons failed', err);
    throw err;
  }
}

export async function claimCoupon(couponId: string): Promise<UserCoupon> {
  try {
    const res = await axiosForBackend({
      url: `/api/coupons/${couponId}/claim`,
      method: 'POST',
    });
    return res.data as UserCoupon;
  } catch (err) {
    logger.error('claimCoupon failed', err);
    throw err;
  }
}

export async function getMyCoupons(status?: string): Promise<UserCoupon[]> {
  try {
    const search = new URLSearchParams();
    if (status) search.set('status', status);
    const res = await axiosForBackend({
      url: `/api/coupons/mine?${search.toString()}`,
      method: 'GET',
    });
    return res.data as UserCoupon[];
  } catch (err) {
    logger.error('getMyCoupons failed', err);
    throw err;
  }
}

export async function getAvailableCouponsForCheckout(
  amount: number,
  categoryIds?: string[],
  productIds?: string[],
): Promise<UserCoupon[]> {
  try {
    const search = new URLSearchParams();
    search.set('amount', String(amount));
    if (categoryIds && categoryIds.length > 0) {
      search.set('categoryIds', categoryIds.join(','));
    }
    if (productIds && productIds.length > 0) {
      search.set('productIds', productIds.join(','));
    }
    const res = await axiosForBackend({
      url: `/api/coupons/checkout-available?${search.toString()}`,
      method: 'GET',
    });
    return res.data as UserCoupon[];
  } catch (err) {
    logger.error('getAvailableCouponsForCheckout failed', err);
    throw err;
  }
}
