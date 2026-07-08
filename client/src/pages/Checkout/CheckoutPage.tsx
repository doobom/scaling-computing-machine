import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronRight,
  CreditCard,
  Check,
  Package,
  Loader2,
  Ticket,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Textarea } from '@client/src/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';
import { Badge } from '@client/src/components/ui/badge';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { useMemberProfile } from '@client/src/hooks/useMemberProfile';
import {
  getCart,
  getAddresses,
  createOrder,
} from '@client/src/api/order';
import CouponSelectDialog from './CouponSelectDialog';
import AddressDialog from './AddressDialog';
import { useCheckoutCoupon } from './useCheckoutCoupon';
import type { CartItem, Address } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const PAYMENT_METHODS = [
  { value: 'fps', labelZh: 'FPS 轉數快', labelEn: 'FPS', icon: '💳' },
  { value: 'payme', labelZh: 'PayMe', labelEn: 'PayMe', icon: '💰' },
  { value: 'bank_transfer', labelZh: '銀行轉賬', labelEn: 'Bank Transfer', icon: '🏦' },
  { value: 'alipay_hk', labelZh: 'AlipayHK', labelEn: 'AlipayHK', icon: '📱' },
];

const CheckoutPage = () => {
  const { lang } = useLanguage();
  const { discountRate: memberDiscountRate } = useMemberProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { cartItemIds?: string[] } | null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('fps');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newAddress, setNewAddress] = useState({
    receiverName: '',
    receiverPhone: '',
    region: '',
    detailAddress: '',
    isDefault: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cartData, addrData] = await Promise.all([getCart(), getAddresses()]);
      const selectedIds = state?.cartItemIds || [];
      const filtered =
        selectedIds.length > 0
          ? cartData.items.filter((i: CartItem) => selectedIds.includes(i.id))
          : cartData.items;
      setItems(filtered);
      setAddresses(addrData);
      if (addrData.length > 0) {
        const defaultAddr = addrData.find((a: Address) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : addrData[0].id);
      }
    } catch (err) {
      logger.error('load checkout data error', err);
    } finally {
      setLoading(false);
    }
  }, [state?.cartItemIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddressCreated = (addr: Address) => {
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddressId(addr.id);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = totalAmount >= 299 || items.length === 0 ? 0 : 30;

  const {
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
  } = useCheckoutCoupon(totalAmount, shippingFee);

  const memberDiscountAmount =
    memberDiscountRate < 1 ? totalAmount * (1 - memberDiscountRate) : 0;
  const discountAmount = couponDiscountAmount + memberDiscountAmount;
  const payAmount = totalAmount - discountAmount + shippingFee;

  const handleOpenCouponDialog = () => {
    setCouponDialogOpen(true);
    loadAvailableCoupons(items, totalAmount);
  };

  const handleSubmit = async () => {
    if (!selectedAddressId || items.length === 0) return;
    try {
      setSubmitting(true);
      const result = await createOrder({
        items: items.map((item) => ({
          cartId: item.id,
          productId: item.productId,
          spec: item.spec,
          quantity: item.quantity,
        })),
        addressId: selectedAddressId,
        paymentMethod,
        remark,
      });
      navigate(`/payment/${result.orderId}`);
    } catch (err) {
      logger.error('create order error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const specLabel = (spec: Record<string, string>) =>
    Object.entries(spec)
      .map(([, v]) => v)
      .join(' / ');

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {lang === 'zh' ? '確認訂單' : 'Confirm Order'}
      </h1>

      {/* Address Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '收貨地址' : 'Shipping Address'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 && (
            <div className="space-y-3 mb-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAddressId === addr.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{addr.receiverName}</span>
                        <span className="text-muted-foreground text-sm">
                          {addr.receiverPhone}
                        </span>
                        {addr.isDefault && (
                          <Badge variant="default" className="text-xs">
                            {lang === 'zh' ? '預設' : 'Default'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {addr.region} {addr.detailAddress}
                      </div>
                    </div>
                    {selectedAddressId === addr.id && (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <AddressDialog onAddressCreated={handleAddressCreated} />
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '商品清單' : 'Items'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex gap-3 first:pt-0 last:pb-0">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.productImageUrl ? (
                    <img
                      src={item.productImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                  </div>
                  {specLabel(item.spec) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {specLabel(item.spec)}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-price font-mono font-semibold text-sm">
                      HK${item.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      × {item.quantity} ={' '}
                      <span className="text-foreground font-mono font-medium">
                        HK${item.subtotal.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '支付方式' : 'Payment Method'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <div key={method.value}>
                  <RadioGroupItem
                    value={method.value}
                    id={`pay-${method.value}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`pay-${method.value}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === method.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-sm font-medium">
                      {lang === 'zh' ? method.labelZh : method.labelEn}
                    </span>
                    {paymentMethod === method.value && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Remark */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {lang === 'zh' ? '訂單備註' : 'Order Remark'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={lang === 'zh' ? '有什麼想告訴賣家？' : 'Anything to tell the seller?'}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2 text-sm">
            {/* 选择优惠券 */}
            <div
              className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              onClick={handleOpenCouponDialog}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent" />
                <span className="text-foreground font-medium">
                  {lang === 'zh' ? '選擇優惠券' : 'Select Coupon'}
                </span>
                {availableCoupons.length > 0 && (
                  <Badge variant="default" className="text-xs bg-accent hover:bg-accent">
                    {availableCoupons.length} {lang === 'zh' ? '張可用' : ' available'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                {selectedCoupon?.coupon ? (
                  <span className="text-accent font-medium">
                    {lang === 'zh'
                      ? selectedCoupon.coupon.nameZh
                      : selectedCoupon.coupon.nameEn}
                  </span>
                ) : (
                  <span className="text-sm">
                    {lang === 'zh' ? '請選擇' : 'Please select'}
                  </span>
                )}
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">
                {lang === 'zh' ? '商品總額' : 'Subtotal'}
              </span>
              <span className="font-mono">HK${totalAmount.toFixed(2)}</span>
            </div>
            {memberDiscountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'zh' ? '會員折扣' : 'Member Discount'}
                </span>
                <span className="font-mono text-accent">
                  -HK${memberDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {couponDiscountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'zh' ? '優惠券抵扣' : 'Coupon Discount'}
                </span>
                <span className="font-mono text-accent">
                  -HK${couponDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {lang === 'zh' ? '運費' : 'Shipping'}
              </span>
              <span className="font-mono">
                {shippingFee === 0
                  ? lang === 'zh'
                    ? '免運費'
                    : 'Free'
                  : `HK$${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
              <span className="font-medium">
                {lang === 'zh' ? '應付總額' : 'Total'}
              </span>
              <span className="text-price text-2xl font-bold font-mono">
                HK${payAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <Button
            className="w-full mt-6"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !selectedAddressId || items.length === 0}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'zh' ? '提交訂單' : 'Place Order'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <CouponSelectDialog
        open={couponDialogOpen}
        onOpenChange={setCouponDialogOpen}
        coupons={availableCoupons}
        loading={couponsLoading}
        selectedId={selectedCouponId}
        onSelect={handleSelectCoupon}
        onConfirm={handleConfirmCoupon}
        onClear={clearCoupon}
      />
    </div>
  );
};

export default CheckoutPage;
