import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Label } from '@client/src/components/ui/label';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import OperationLogTable from './OperationLogTable';

interface OperationLogItem {
  id: string;
  adminId: string;
  adminName?: string;
  operationType: string;
  targetType: string;
  targetId: string;
  content: string;
  ipAddress: string;
  beforeValue: Record<string, unknown>;
  afterValue: Record<string, unknown>;
  createdAt: string;
}

const MODULE_OPTIONS = [
  { value: '', labelZh: '全部模組', labelEn: 'All Modules' },
  { value: 'order', labelZh: '訂單', labelEn: 'Order' },
  { value: 'product', labelZh: '商品', labelEn: 'Product' },
  { value: 'coupon', labelZh: '優惠券', labelEn: 'Coupon' },
  { value: 'after_sales', labelZh: '售後', labelEn: 'After-Sales' },
  { value: 'user', labelZh: '用戶', labelEn: 'User' },
];

const OperationLog = () => {
  const { lang } = useLanguage();
  const [list, setList] = useState<OperationLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [adminName, setAdminName] = useState('');
  const [targetType, setTargetType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (adminName) params.set('adminName', adminName);
      if (targetType) params.set('targetType', targetType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/operation-logs?${params.toString()}`);
      const data = await res.json();
      setList(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      logger.error('load operation logs error', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, adminName, targetType, startDate, endDate]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSearch = () => {
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {lang === 'zh' ? '操作日誌' : 'Operation Log'}
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '操作人' : 'Operator'}
              </Label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder={lang === 'zh' ? '輸入操作人' : 'Enter operator'}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '模組' : 'Module'}
              </Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value}>
                      {lang === 'zh' ? opt.labelZh : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '開始日期' : 'Start Date'}
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '結束日期' : 'End Date'}
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
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
          <OperationLogTable
            items={list}
            loading={loading}
            expandedId={expandedId}
            onToggleExpand={(id) =>
              setExpandedId(expandedId === id ? null : id)
            }
          />

          {total > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {lang === 'zh'
                  ? `共 ${total} 條記錄`
                  : `Total ${total} records`}
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
    </div>
  );
};

export default OperationLog;
