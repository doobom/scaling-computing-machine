import { useState, useCallback } from 'react';
import { getAvailableCouponsForCheckout } from '@client/src/api/coupon';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { CartItem, UserCoupon, Coupon } from '@shared/api.interface';

export interface UseCheckoutCouponReturn {
  couponDialogOpen: boolean;
  setCouponDialogOpen: (open: boolean) => void;
  availableCoupons: UserCoupon[];
  couponsLoading: boolean;
  selectedCouponId: string | null;
  selectedCoupon: UserCoupon | undefined;
  couponDiscountAmount: number;
  loadAvailableCoupons: (items: CartItem[], totalAmount: number) => void;
  handleSelectCoupon: (userCouponId: string) => void;
  handleConfirmCoupon: () => void;
  clearCoupon: () => void;
}

export function useCheckoutCoupon(
  totalAmount: number,
  shippingFee: number,
): UseCheckoutCouponReturn {
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const selectedCoupon = availableCoupons.find(
    (c: UserCoupon) => c.id === selectedCouponId,
  );

  // 计算优惠券抵扣金额
  const couponDiscountAmount = (() => {
    const cp: Coupon | undefined = selectedCoupon?.coupon;
    if (!cp) return 0;
    if (totalAmount < cp.minAmount) return 0;
    switch (cp.type) {
      case 'fixed':
        return Math.min(cp.discountValue, totalAmount);
      case 'percent':
        return Number((totalAmount * (1 - cp.discountValue)).toFixed(2));
      case 'shipping':
        return shippingFee;
      default:
        return 0;
    }
  })();

  const loadAvailableCoupons = useCallback(
    async (items: CartItem[], amount: number) => {
      if (items.length === 0 || amount <= 0) {
        setAvailableCoupons([]);
        return;
      }
      try {
        setCouponsLoading(true);
        const productIds = items.map((item: CartItem) => item.productId);
        const data = await getAvailableCouponsForCheckout(
          amount,
          undefined,
          productIds,
        );
        setAvailableCoupons(data || []);
      } catch (err) {
        logger.error('load available coupons error', err);
      } finally {
        setCouponsLoading(false);
      }
    },
    [],
  );

  const handleSelectCoupon = useCallback((userCouponId: string) => {
    setSelectedCouponId((prev) => (prev === userCouponId ? null : userCouponId));
  }, []);

  const handleConfirmCoupon = useCallback(() => {
    setCouponDialogOpen(false);
  }, []);

  const clearCoupon = useCallback(() => {
    setSelectedCouponId(null);
  }, []);

  return {
    couponDialogOpen,
    setCouponDialogOpen,
    availableCoupons,
    couponsLoading,
    selectedCouponId,
    selectedCoupon,
    couponDiscountAmount,
    loadAvailableCoupons,
    handleSelectCoupon,
    handleConfirmCoupon,
    clearCoupon,
  };
}
