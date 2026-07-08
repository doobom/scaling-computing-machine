import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  XCircle,
  Truck,
  RefreshCw,
  Package,
  Loader2,
  Send,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getAfterSalesDetail,
  submitReturnTracking,
} from '@client/src/api/after-sales';
import type { AfterSales } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import AfterSalesTimeline from './AfterSalesTimeline';

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

const AfterSalesDetail = () => {
  const { lang } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AfterSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getAfterSalesDetail(id);
      setDetail(data);
    } catch (err) {
      logger.error('Failed to load after-sales detail', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSubmitTracking = async () => {
    if (!id || !trackingNo || !company) return;
    try {
      setSubmitting(true);
      await submitReturnTracking(id, trackingNo, company);
      setTrackingDialogOpen(false);
      loadDetail();
    } catch (err) {
      logger.error('Failed to submit tracking', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (val: number | string) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="text-center py-16 text-muted-foreground">
          <XCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{lang === 'zh' ? '售後記錄不存在' : 'Record not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {lang === 'zh' ? '售後詳情' : 'After-Sales Detail'}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {detail.afterSalesNo}
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            variant="outline"
            className={`text-xs ${STATUS_COLORS[detail.status] || ''}`}
          >
            {STATUS_LABELS[detail.status]
              ? lang === 'zh'
                ? STATUS_LABELS[detail.status].zh
                : STATUS_LABELS[detail.status].en
              : detail.status}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <AfterSalesTimeline
            type={detail.type}
            status={detail.status}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* After-sales info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '售後資訊' : 'After-Sales Info'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lang === 'zh' ? '售後類型' : 'Type'}
            </span>
            <span className="text-foreground">
              {TYPE_LABELS[detail.type]
                ? lang === 'zh'
                  ? TYPE_LABELS[detail.type].zh
                  : TYPE_LABELS[detail.type].en
                : detail.type}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lang === 'zh' ? '退款原因' : 'Reason'}
            </span>
            <span className="text-foreground">{detail.reason}</span>
          </div>
          {detail.description && (
            <div className="text-sm">
              <span className="text-muted-foreground block mb-1">
                {lang === 'zh' ? '問題描述' : 'Description'}
              </span>
              <p className="text-foreground bg-muted/50 rounded-lg p-3">
                {detail.description}
              </p>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">
              {lang === 'zh' ? '退款金額' : 'Refund Amount'}
            </span>
            <span className="text-price font-semibold font-mono">
              {formatPrice(detail.refundAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lang === 'zh' ? '申請時間' : 'Applied At'}
            </span>
            <span className="text-foreground">{formatDate(detail.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      {detail.images && detail.images.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              {lang === 'zh' ? '憑證圖片' : 'Evidence'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {detail.images.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '商品資訊' : 'Product Info'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
              {detail.images && detail.images.length > 0 ? (
                <img
                  src={detail.images[0].imageUrl}
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
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {detail.reason}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === 'zh' ? '訂單編號' : 'Order No.'}: {detail.orderNo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reject reason */}
      {detail.status === 'rejected' && detail.rejectReason && (
        <Card className="mb-6 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              {lang === 'zh' ? '拒絕原因' : 'Rejection Reason'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground bg-red-50 rounded-lg p-3">
              {detail.rejectReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Return shipping */}
      {detail.type === 'return_refund' &&
        (detail.status === 'approved' ||
          detail.status === 'returning' ||
          detail.status === 'refunding' ||
          detail.status === 'completed') && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-accent" />
                {lang === 'zh' ? '退貨物流' : 'Return Shipping'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.returnTrackingNo ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {lang === 'zh' ? '物流公司' : 'Company'}
                    </span>
                    <span className="text-foreground">{detail.returnCompany}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {lang === 'zh' ? '物流單號' : 'Tracking No.'}
                    </span>
                    <span className="text-foreground font-mono">
                      {detail.returnTrackingNo}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {lang === 'zh'
                      ? '請填寫退貨物流資訊以便商家確認收貨'
                      : 'Please fill in return tracking info'}
                  </p>
                  <Dialog
                    open={trackingDialogOpen}
                    onOpenChange={setTrackingDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Send className="w-4 h-4" />
                        {lang === 'zh' ? '填寫物流單號' : 'Submit Tracking'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {lang === 'zh' ? '填寫退貨物流' : 'Return Tracking'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>
                            {lang === 'zh' ? '物流公司' : 'Logistics Company'}
                          </Label>
                          <Input
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="mt-1"
                            placeholder={
                              lang === 'zh' ? '請輸入物流公司' : 'Enter company'
                            }
                          />
                        </div>
                        <div>
                          <Label>
                            {lang === 'zh' ? '物流單號' : 'Tracking Number'}
                          </Label>
                          <Input
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            className="mt-1 font-mono"
                            placeholder={
                              lang === 'zh' ? '請輸入單號' : 'Enter tracking no.'
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                          </Button>
                        </DialogClose>
                        <Button
                          onClick={handleSubmitTracking}
                          disabled={!trackingNo || !company || submitting}
                        >
                          {submitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {lang === 'zh' ? '確認提交' : 'Submit'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 md:static md:mt-6 md:p-0 md:border-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/member/orders')}
          >
            {lang === 'zh' ? '返回訂單' : 'Back to Orders'}
          </Button>
          {detail.status === 'pending' && (
            <Button variant="default" className="flex-1" disabled>
              <Clock className="w-4 h-4" />
              {lang === 'zh' ? '等待審核' : 'Pending Review'}
            </Button>
          )}
          {detail.status === 'completed' && (
            <Button
              variant="default"
              className="flex-1"
              onClick={() => navigate('/products')}
            >
              <Package className="w-4 h-4" />
              {lang === 'zh' ? '再次購買' : 'Shop Again'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AfterSalesDetail;
