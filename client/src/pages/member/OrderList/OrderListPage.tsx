import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent } from '@client/src/components/ui/card';
import { SkeletonList } from '@client/src/components/ui/skeleton';
import { EmptyState } from '@client/src/components/ui/EmptyState';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getMemberOrders,
  getMemberOrderDetail,
} from '@client/src/api/member';
import type { OrderDetail } from '@client/src/api/member';
import { logger } from '@lark-apaas/client-toolkit/logger';
import OrderDetailDrawer from './OrderDetailDrawer';

const STATUS_TABS = [
  { key: 'all', icon: Package, labelZh: '全部', labelEn: 'All' },
  { key: 'pending_pay', icon: CreditCard, labelZh: '待付款', labelEn: 'To Pay' },
  { key: 'pending_ship', icon: Package, labelZh: '待發貨', labelEn: 'To Ship' },
  { key: 'shipped', icon: Truck, labelZh: '待收貨', labelEn: 'To Receive' },
  { key: 'completed', icon: CheckCircle, labelZh: '已完成', labelEn: 'Completed' },
  { key: 'cancelled', icon: XCircle, labelZh: '已取消', labelEn: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_pay: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_ship: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  pending_pay: { zh: '待付款', en: 'Pending Payment' },
  pending_ship: { zh: '待發貨', en: 'Processing' },
  shipped: { zh: '已發貨', en: 'Shipped' },
  completed: { zh: '已完成', en: 'Completed' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
};

const OrderListPage = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || 'all';

  const [activeTab, setActiveTab] = useState(urlStatus);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const res = await getMemberOrders({ page, pageSize, status });
      setOrders(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleViewDetail = async (order: OrderDetail) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(order);
      setDrawerOpen(true);
      const detail = await getMemberOrderDetail(order.id);
      setSelectedOrder(detail);
    } catch (err) {
      logger.error('Failed to load order detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {lang === 'zh' ? '我的訂單' : 'My Orders'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'zh' ? '查看所有訂單與物流狀態' : 'View all orders and shipping status'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto p-1">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">
                  {lang === 'zh' ? tab.labelZh : tab.labelEn}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {loading ? (
        <SkeletonList count={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          type="order"
          actionPath="/products"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {order.orderNo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_COLORS[order.orderStatus] || ''}`}
                  >
                    {STATUS_LABELS[order.orderStatus]
                      ? lang === 'zh'
                        ? STATUS_LABELS[order.orderStatus].zh
                        : STATUS_LABELS[order.orderStatus].en
                      : order.orderStatus}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2 flex-1">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="w-14 h-14 rounded-md bg-muted overflow-hidden border-2 border-white flex-shrink-0"
                      >
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-full h-full p-2 text-muted-foreground/50" />
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border-2 border-white">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-price font-mono">
                      {formatPrice(order.payAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} {lang === 'zh' ? '件商品' : 'items'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(order)}
                    className="gap-1"
                  >
                    {lang === 'zh' ? '查看詳情' : 'View Detail'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {lang === 'zh' ? '上一頁' : 'Prev'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            {lang === 'zh' ? '下一頁' : 'Next'}
          </Button>
        </div>
      )}

      <OrderDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        order={selectedOrder}
        loading={detailLoading}
        lang={lang}
      />
    </div>
  );
};

export default OrderListPage;
