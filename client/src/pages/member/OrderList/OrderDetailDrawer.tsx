import { Package, Loader2, MapPin, CreditCard, Truck, Clock } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@client/src/components/ui/drawer';
import { Button } from '@client/src/components/ui/button';
import { Separator } from '@client/src/components/ui/separator';
import type { OrderDetail } from '@client/src/api/member';

const STATUS_COLORS: Record<string, string> = {
  pending_pay: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_ship: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  pending_pay: { zh: '待付款', en: 'Pending Payment' },
  pending_ship: { zh: '待發貨', en: 'Pending Shipment' },
  shipped: { zh: '已發貨', en: 'Shipped' },
  completed: { zh: '已完成', en: 'Completed' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
};

const PAYMENT_LABELS: Record<string, { zh: string; en: string }> = {
  fps: { zh: 'FPS 轉數快', en: 'FPS' },
  payme: { zh: 'PayMe', en: 'PayMe' },
  bank_transfer: { zh: '銀行轉賬', en: 'Bank Transfer' },
  alipay_hk: { zh: 'AlipayHK', en: 'AlipayHK' },
};

interface OrderDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail | null;
  loading: boolean;
  lang: 'zh' | 'en';
}

const OrderDetailDrawer = ({
  open,
  onOpenChange,
  order,
  loading,
  lang,
}: OrderDetailDrawerProps) => {
  const statusLabel = (s: string) => {
    const label = STATUS_LABELS[s];
    return label ? (lang === 'zh' ? label.zh : label.en) : s;
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full max-w-md">
        <DrawerHeader>
          <DrawerTitle>{lang === 'zh' ? '訂單詳情' : 'Order Detail'}</DrawerTitle>
          <DrawerDescription>{order?.orderNo}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : order ? (
            <div className="space-y-5">
              {/* 状态 */}
              <div>
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[order.orderStatus] || ''}`}
                >
                  {statusLabel(order.orderStatus)}
                </Badge>
              </div>

              {/* 物流信息 */}
              {order.shippingNo && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="w-4 h-4 text-primary" />
                    {lang === 'zh' ? '物流信息' : 'Shipping Info'}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      {lang === 'zh' ? '物流公司：' : 'Carrier: '}
                      <span className="text-foreground">
                        {order.shippingCompany || '-'}
                      </span>
                    </div>
                    <div>
                      {lang === 'zh' ? '運單號：' : 'Tracking No: '}
                      <span className="text-foreground font-mono">
                        {order.shippingNo}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 商品明细 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  {lang === 'zh' ? '商品明細' : 'Items'}
                </h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-full h-full p-3 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            x{item.quantity}
                          </span>
                          <span className="text-sm font-semibold text-price font-mono">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 金额明细 */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '商品總額' : 'Subtotal'}
                  </span>
                  <span className="font-mono">{formatPrice(order.totalAmount)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {lang === 'zh' ? '優惠折扣' : 'Discount'}
                    </span>
                    <span className="font-mono text-accent">
                      -{formatPrice(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '運費' : 'Shipping'}
                  </span>
                  <span className="font-mono">{formatPrice(order.shippingFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{lang === 'zh' ? '實付金額' : 'Total Paid'}</span>
                  <span className="text-price font-mono text-base">
                    {formatPrice(order.payAmount)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* 支付信息 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <CreditCard className="w-4 h-4 text-primary" />
                  {lang === 'zh' ? '支付信息' : 'Payment'}
                </div>
                <div className="text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>{lang === 'zh' ? '支付方式' : 'Method'}</span>
                    <span className="text-foreground">
                      {PAYMENT_LABELS[order.paymentMethod]
                        ? lang === 'zh'
                          ? PAYMENT_LABELS[order.paymentMethod].zh
                          : PAYMENT_LABELS[order.paymentMethod].en
                        : order.paymentMethod || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'zh' ? '支付狀態' : 'Status'}</span>
                    <span className="text-foreground">
                      {order.paymentStatus === 'paid'
                        ? lang === 'zh'
                          ? '已支付'
                          : 'Paid'
                        : lang === 'zh'
                        ? '未支付'
                        : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 时间线 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  {lang === 'zh' ? '訂單時間' : 'Order Timeline'}
                </div>
                <div className="text-muted-foreground space-y-1.5">
                  <div className="flex justify-between">
                    <span>{lang === 'zh' ? '下單時間' : 'Created'}</span>
                    <span className="text-foreground text-xs">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  {order.paidAt && (
                    <div className="flex justify-between">
                      <span>{lang === 'zh' ? '付款時間' : 'Paid'}</span>
                      <span className="text-foreground text-xs">
                        {formatDate(order.paidAt)}
                      </span>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div className="flex justify-between">
                      <span>{lang === 'zh' ? '發貨時間' : 'Shipped'}</span>
                      <span className="text-foreground text-xs">
                        {formatDate(order.shippedAt)}
                      </span>
                    </div>
                  )}
                  {order.completedAt && (
                    <div className="flex justify-between">
                      <span>{lang === 'zh' ? '完成時間' : 'Completed'}</span>
                      <span className="text-foreground text-xs">
                        {formatDate(order.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {order.remark && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <div className="font-medium mb-1">
                      {lang === 'zh' ? '備註' : 'Remark'}
                    </div>
                    <div className="text-muted-foreground">{order.remark}</div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {lang === 'zh' ? '關閉' : 'Close'}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDetailDrawer;
