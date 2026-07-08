import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent } from '@client/src/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { getAfterSalesList } from '@client/src/api/after-sales';
import type { AfterSales } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const STATUS_TABS = [
  { key: 'all', icon: Package, labelZh: '全部', labelEn: 'All' },
  { key: 'pending', icon: Clock, labelZh: '待審核', labelEn: 'Pending' },
  { key: 'processing', icon: RefreshCw, labelZh: '處理中', labelEn: 'Processing' },
  { key: 'completed', icon: CheckCircle, labelZh: '已完成', labelEn: 'Completed' },
  { key: 'rejected', icon: XCircle, labelZh: '已拒絕', labelEn: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  returning: 'bg-blue-100 text-blue-700 border-blue-200',
  refunding: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  pending: { zh: '待審核', en: 'Pending Review' },
  approved: { zh: '已通過', en: 'Approved' },
  returning: { zh: '退貨中', en: 'Returning' },
  refunding: { zh: '退款中', en: 'Refunding' },
  completed: { zh: '已完成', en: 'Completed' },
  rejected: { zh: '已拒絕', en: 'Rejected' },
};

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  refund_only: { zh: '僅退款', en: 'Refund Only' },
  return_refund: { zh: '退貨退款', en: 'Return & Refund' },
};

const AfterSalesList = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState<AfterSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const res = await getAfterSalesList({ page, pageSize, status });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('Failed to load after-sales list', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const formatPrice = (val: number | string) => {
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
          {lang === 'zh' ? '售後退款' : 'After Sales'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'zh'
            ? '查看所有售後申請與退款進度'
            : 'View all after-sales requests and refund status'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-5 h-auto p-1">
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
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-4">
            {lang === 'zh' ? '暫無售後記錄' : 'No after-sales records yet'}
          </p>
          <Button onClick={() => navigate('/products')}>
            <ShoppingBag className="w-4 h-4" />
            {lang === 'zh' ? '去購物' : 'Go Shopping'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/member/after-sales/${item.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.afterSalesNo}
                    </span>
                    {item.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {TYPE_LABELS[item.type]
                        ? lang === 'zh'
                          ? TYPE_LABELS[item.type].zh
                          : TYPE_LABELS[item.type].en
                        : item.type}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_COLORS[item.status] || ''}`}
                  >
                    {STATUS_LABELS[item.status]
                      ? lang === 'zh'
                        ? STATUS_LABELS[item.status].zh
                        : STATUS_LABELS[item.status].en
                      : item.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0].imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">
                      {item.reason}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-price font-mono">
                      {formatPrice(item.refundAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lang === 'zh' ? '退款金額' : 'Refund'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-3 pt-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="gap-1">
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
    </div>
  );
};

export default AfterSalesList;
