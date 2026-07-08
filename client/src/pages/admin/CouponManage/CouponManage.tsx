import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Tag,
  Percent,
  Truck,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
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
import CouponFormDialog from './CouponFormDialog';
import type { Coupon } from '@shared/api.interface';

const TYPE_OPTIONS = [
  { value: '', labelZh: '全部類型', labelEn: 'All Types' },
  { value: 'fixed', labelZh: '滿減券', labelEn: 'Fixed Discount' },
  { value: 'percent', labelZh: '折扣券', labelEn: 'Percent Discount' },
  { value: 'shipping', labelZh: '免運券', labelEn: 'Free Shipping' },
];

const STATUS_OPTIONS = [
  { value: '', labelZh: '全部狀態', labelEn: 'All Status' },
  { value: 'active', labelZh: '啟用中', labelEn: 'Active' },
  { value: 'inactive', labelZh: '已停用', labelEn: 'Inactive' },
];

const CouponManage = () => {
  const { lang } = useLanguage();
  const [list, setList] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await res.json();
      setList(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      logger.error('load coupon list error', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, type, status]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openCreate = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      await fetch(`/api/admin/coupons/${coupon.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadList();
    } catch (err) {
      logger.error('toggle coupon status error', err);
    }
  };

  const typeLabel = (t: string) => {
    const opt = TYPE_OPTIONS.find((o) => o.value === t);
    return opt ? (lang === 'zh' ? opt.labelZh : opt.labelEn) : t;
  };

  const typeIcon = (t: string) => {
    if (t === 'fixed') return <Tag className="w-4 h-4" />;
    if (t === 'percent') return <Percent className="w-4 h-4" />;
    return <Truck className="w-4 h-4" />;
  };

  const formatPrice = (val: number) => `HK$${val.toFixed(2)}`;

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.type === 'fixed') return formatPrice(coupon.discountValue);
    if (coupon.type === 'percent') return `${coupon.discountValue}折`;
    return lang === 'zh' ? '免運費' : 'Free Shipping';
  };

  const formatValidPeriod = (coupon: Coupon) => {
    if (coupon.validType === 'days') {
      return lang === 'zh'
        ? `領取後${coupon.validDays}天有效`
        : `${coupon.validDays} days after claim`;
    }
    if (coupon.startTime && coupon.endTime) {
      return `${coupon.startTime.slice(0, 10)} ~ ${coupon.endTime.slice(0, 10)}`;
    }
    return '-';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {lang === 'zh' ? '優惠券管理' : 'Coupon Management'}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {lang === 'zh' ? '新建優惠券' : 'New Coupon'}
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === 'zh' ? '類型' : 'Type'}
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value}>
                      {lang === 'zh' ? opt.labelZh : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'zh' ? '名稱' : 'Name'}</TableHead>
                <TableHead>{lang === 'zh' ? '類型' : 'Type'}</TableHead>
                <TableHead>{lang === 'zh' ? '面額/折扣' : 'Discount'}</TableHead>
                <TableHead>{lang === 'zh' ? '使用門檻' : 'Min. Amount'}</TableHead>
                <TableHead>{lang === 'zh' ? '庫存/已領' : 'Stock/Claimed'}</TableHead>
                <TableHead>{lang === 'zh' ? '有效期' : 'Valid Period'}</TableHead>
                <TableHead>{lang === 'zh' ? '狀態' : 'Status'}</TableHead>
                <TableHead className="text-right">
                  {lang === 'zh' ? '操作' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {lang === 'zh' ? '暫無數據' : 'No data'}
                  </TableCell>
                </TableRow>
              ) : (
                list.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">
                      {lang === 'zh' ? coupon.nameZh : coupon.nameEn}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {typeIcon(coupon.type)}
                        {typeLabel(coupon.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-price">
                      {formatDiscount(coupon)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {coupon.minAmount > 0 ? formatPrice(coupon.minAmount) : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-mono">{coupon.usedQuantity}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        / {coupon.totalQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatValidPeriod(coupon)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          coupon.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }
                      >
                        {coupon.status === 'active'
                          ? lang === 'zh'
                            ? '啟用中'
                            : 'Active'
                          : lang === 'zh'
                            ? '已停用'
                            : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(coupon)}
                        >
                          {coupon.status === 'active' ? (
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
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

      <CouponFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCoupon={editingCoupon}
        onSuccess={loadList}
      />
    </div>
  );
};

export default CouponManage;
