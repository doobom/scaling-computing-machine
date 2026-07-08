import { Package, Loader2 } from 'lucide-react';
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
import type { Order, OrderItem } from '@shared/api.interface';

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

interface OrderDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
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
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div>
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[order.orderStatus] || ''}`}
                >
                  {statusLabel(order.orderStatus)}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  {lang === 'zh' ? '收貨地址' : 'Shipping Address'}
                </h3>
                {order.address ? (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="font-medium">
                      {order.address.receiverName}{' '}
                      <span className="text-muted-foreground font-normal">
                        {order.address.receiverPhone}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {order.address.region} {order.address.detailAddress}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">-</div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  {lang === 'zh' ? '商品明細' : 'Items'}
                </h3>
                <div className="space-y-2">
                  {order.items?.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(item.spec)
                            .map(([, v]) => v)
                            .join(' / ')}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-price font-mono">
                            HK${item.salePrice.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            × {item.quantity}
                          </span>
                          <span className="float-right font-mono">
                            HK${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '商品總額' : 'Subtotal'}
                  </span>
                  <span className="font-mono">HK${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '優惠' : 'Discount'}
                  </span>
                  <span className="font-mono text-accent">
                    -HK${order.discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '運費' : 'Shipping'}
                  </span>
                  <span className="font-mono">HK${order.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-semibold">
                  <span>{lang === 'zh' ? '應付總額' : 'Total'}</span>
                  <span className="text-price font-mono">
                    HK${order.payAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {order.shippingNo && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="font-medium">
                    {lang === 'zh' ? '物流信息' : 'Shipping Info'}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {order.shippingCompany} - {order.shippingNo}
                  </div>
                </div>
              )}

              {order.remark && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="font-medium">
                    {lang === 'zh' ? '訂單備註' : 'Remark'}
                  </div>
                  <div className="text-muted-foreground mt-1">{order.remark}</div>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">{lang === 'zh' ? '關閉' : 'Close'}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDetailDrawer;
