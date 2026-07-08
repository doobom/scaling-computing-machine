import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Package,
  Eye,
  Truck,
  XCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import OrderDetailDrawer from './OrderDetailDrawer';
import { Badge } from '@client/src/components/ui/badge';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Card, CardContent } from '@client/src/components/ui/card';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getAdminOrders,
  getAdminOrderDetail,
  shipOrder,
  adminCancelOrder,
  updateOrderRemark,
} from '@client/src/api/order';
import type { Order } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const STATUS_OPTIONS = [
  { value: '', labelZh: '全部狀態', labelEn: 'All Status' },
  { value: 'pending_pay', labelZh: '待付款', labelEn: 'Pending Payment' },
  { value: 'pending_ship', labelZh: '待發貨', labelEn: 'Pending Shipment' },
  { value: 'shipped', labelZh: '已發貨', labelEn: 'Shipped' },
  { value: 'completed', labelZh: '已完成', labelEn: 'Completed' },
  { value: 'cancelled', labelZh: '已取消', labelEn: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_pay: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_ship: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PAYMENT_LABELS: Record<string, { zh: string; en: string }> = {
  fps: { zh: 'FPS 轉數快', en: 'FPS' },
  payme: { zh: 'PayMe', en: 'PayMe' },
  bank_transfer: { zh: '銀行轉賬', en: 'Bank Transfer' },
  alipay_hk: { zh: 'AlipayHK', en: 'AlipayHK' },
};

const OrderManage = () => {
  const { lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [orderNo, setOrderNo] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [shipOrderId, setShipOrderId] = useState('');
  const [shippingNo, setShippingNo] = useState('');
  const [shippingCompany, setShippingCompany] = useState('SF Express');
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipSubmitting, setShipSubmitting] = useState(false);

  const [remarkOrderId, setRemarkOrderId] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkSubmitting, setRemarkSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminOrders({
        page,
        pageSize,
        orderNo: orderNo || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('load orders error', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, orderNo, status, startDate, endDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleViewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const data = await getAdminOrderDetail(id);
      setDetailOrder(data);
    } catch (err) {
      logger.error('load order detail error', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleShip = async () => {
    try {
      setShipSubmitting(true);
      await shipOrder(shipOrderId, shippingNo, shippingCompany);
      setShipDialogOpen(false);
      setShippingNo('');
      loadOrders();
    } catch (err) {
      logger.error('ship order error', err);
    } finally {
      setShipSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await adminCancelOrder(id);
      loadOrders();
    } catch (err) {
      logger.error('cancel order error', err);
    }
  };

  const handleRemark = async () => {
    try {
      setRemarkSubmitting(true);
      await updateOrderRemark(remarkOrderId, remarkText);
      setRemarkDialogOpen(false);
      setRemarkText('');
      loadOrders();
    } catch (err) {
      logger.error('update remark error', err);
    } finally {
      setRemarkSubmitting(false);
    }
  };

  const openShipDialog = (id: string) => {
    setShipOrderId(id);
    setShipDialogOpen(true);
  };

  const openRemarkDialog = (order: Order) => {
    setRemarkOrderId(order.id);
    setRemarkText(order.remark || '');
    setRemarkDialogOpen(true);
  };

  const statusLabel = (s: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    return opt ? (lang === 'zh' ? opt.labelZh : opt.labelEn) : s;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {lang === 'zh' ? '訂單管理' : 'Order Management'}
        </h1>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'zh' ? '訂單號' : 'Order No.'}</TableHead>
                <TableHead>{lang === 'zh' ? '下單時間' : 'Order Time'}</TableHead>
                <TableHead>{lang === 'zh' ? '金額' : 'Amount'}</TableHead>
                <TableHead>{lang === 'zh' ? '支付方式' : 'Payment'}</TableHead>
                <TableHead>{lang === 'zh' ? '狀態' : 'Status'}</TableHead>
                <TableHead className="text-right">
                  {lang === 'zh' ? '操作' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {lang === 'zh' ? '暫無訂單' : 'No orders'}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderNo}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('zh-HK')
                        : '-'}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-price">
                      HK${order.payAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.paymentMethod
                        ? lang === 'zh'
                          ? PAYMENT_LABELS[order.paymentMethod]?.zh || order.paymentMethod
                          : PAYMENT_LABELS[order.paymentMethod]?.en || order.paymentMethod
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[order.orderStatus] || ''}`}
                      >
                        {statusLabel(order.orderStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.orderStatus === 'pending_ship' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openShipDialog(order.id)}
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                        )}
                        {order.orderStatus !== 'completed' &&
                          order.orderStatus !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(order.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRemarkDialog(order)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
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

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={detailOrder}
        loading={detailLoading}
        lang={lang}
      />

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '發貨' : 'Ship Order'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{lang === 'zh' ? '物流公司' : 'Shipping Company'}</Label>
              <Input
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{lang === 'zh' ? '運單號' : 'Tracking No.'}</Label>
              <Input
                value={shippingNo}
                onChange={(e) => setShippingNo(e.target.value)}
                placeholder={lang === 'zh' ? '請輸入運單號' : 'Enter tracking number'}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
            </DialogClose>
            <Button onClick={handleShip} disabled={shipSubmitting || !shippingNo}>
              {shipSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === 'zh' ? '確認發貨' : 'Confirm Ship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lang === 'zh' ? '訂單備註' : 'Order Remark'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder={lang === 'zh' ? '輸入備註內容' : 'Enter remark'}
              rows={4}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
            </DialogClose>
            <Button onClick={handleRemark} disabled={remarkSubmitting}>
              {remarkSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === 'zh' ? '保存' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManage;
