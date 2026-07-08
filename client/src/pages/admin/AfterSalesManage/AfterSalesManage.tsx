import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Label } from '@client/src/components/ui/label';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import AfterSalesDetailDialog from './AfterSalesDetailDialog';
import type { AfterSales } from '@shared/api.interface';

const STATUS_OPTIONS = [
  { value: '', labelZh: '全部狀態', labelEn: 'All Status' },
  { value: 'pending', labelZh: '待審核', labelEn: 'Pending' },
  { value: 'approved', labelZh: '已同意', labelEn: 'Approved' },
  { value: 'returning', labelZh: '退貨中', labelEn: 'Returning' },
  { value: 'refunding', labelZh: '退款中', labelEn: 'Refunding' },
  { value: 'completed', labelZh: '已完成', labelEn: 'Completed' },
  { value: 'rejected', labelZh: '已拒絕', labelEn: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  returning: 'bg-blue-100 text-blue-700 border-blue-200',
  refunding: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  refund_only: { zh: '僅退款', en: 'Refund Only' },
  return_refund: { zh: '退貨退款', en: 'Return & Refund' },
};

const AfterSalesManage = () => {
  const { lang } = useLanguage();
  const [list, setList] = useState<AfterSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [afterSalesNo, setAfterSalesNo] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [status, setStatus] = useState('');

  const [detail, setDetail] = useState<AfterSales | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (afterSalesNo) params.set('afterSalesNo', afterSalesNo);
      if (orderNo) params.set('orderNo', orderNo);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/after-sales?${params.toString()}`);
      const data = await res.json();
      setList(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      logger.error('load after sales list error', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, afterSalesNo, orderNo, status]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleViewDetail = async (item: AfterSales) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      setDetail(item);
      const res = await fetch(`/api/admin/after-sales/${item.id}`);
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      logger.error('load after sales detail error', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const statusLabel = (s: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    return opt ? (lang === 'zh' ? opt.labelZh : opt.labelEn) : s;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-HK');
  };

  const formatPrice = (val: number) => `HK$${val.toFixed(2)}`;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {lang === 'zh' ? '售後管理' : 'After-Sales Management'}
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '售後單號' : 'After-Sales No.'}
              </Label>
              <Input
                value={afterSalesNo}
                onChange={(e) => setAfterSalesNo(e.target.value)}
                placeholder={lang === 'zh' ? '輸入售後單號' : 'Enter after-sales no.'}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '訂單號' : 'Order No.'}
              </Label>
              <Input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder={lang === 'zh' ? '輸入訂單號' : 'Enter order no.'}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '狀態' : 'Status'}
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value}>
                      {lang === 'zh' ? opt.labelZh : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="w-4 h-4" />
                {lang === 'zh' ? '搜尋' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'zh' ? '售後單號' : 'AS No.'}</TableHead>
                <TableHead>{lang === 'zh' ? '訂單號' : 'Order No.'}</TableHead>
                <TableHead>{lang === 'zh' ? '類型' : 'Type'}</TableHead>
                <TableHead>{lang === 'zh' ? '退款金額' : 'Refund Amt.'}</TableHead>
                <TableHead>{lang === 'zh' ? '狀態' : 'Status'}</TableHead>
                <TableHead>{lang === 'zh' ? '申請時間' : 'Apply Time'}</TableHead>
                <TableHead className="text-right">
                  {lang === 'zh' ? '操作' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {lang === 'zh' ? '暫無數據' : 'No data'}
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {item.afterSalesNo}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.orderNo}</TableCell>
                    <TableCell className="text-sm">
                      {TYPE_LABELS[item.type]
                        ? lang === 'zh'
                          ? TYPE_LABELS[item.type].zh
                          : TYPE_LABELS[item.type].en
                        : item.type}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-price">
                      {formatPrice(item.refundAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[item.status] || ''}`}
                      >
                        {statusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {total > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {lang === 'zh' ? `共 ${total} 條記錄` : `Total ${total} records`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AfterSalesDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        detail={detail}
        loading={detailLoading}
        onRefresh={loadList}
      />
    </div>
  );
};

export default AfterSalesManage;
