import { Loader2 } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { AfterSales } from '@shared/api.interface';

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

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  pending: { zh: '待審核', en: 'Pending' },
  approved: { zh: '已同意', en: 'Approved' },
  returning: { zh: '退貨中', en: 'Returning' },
  refunding: { zh: '退款中', en: 'Refunding' },
  completed: { zh: '已完成', en: 'Completed' },
  rejected: { zh: '已拒絕', en: 'Rejected' },
};

interface AfterSalesDetailContentProps {
  detail: AfterSales | null;
  loading: boolean;
}

const AfterSalesDetailContent = ({ detail, loading }: AfterSalesDetailContentProps) => {
  const { lang } = useLanguage();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-HK');
  };

  const formatPrice = (val: number) => `HK$${val.toFixed(2)}`;

  const statusLabel = (s: string) => {
    const label = STATUS_LABELS[s];
    return label ? (lang === 'zh' ? label.zh : label.en) : s;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">
            {lang === 'zh' ? '售後單號：' : 'AS No.: '}
          </span>
          <span className="font-mono">{detail.afterSalesNo}</span>
        </div>
        <div>
          <span className="text-muted-foreground">
            {lang === 'zh' ? '訂單號：' : 'Order No.: '}
          </span>
          <span className="font-mono">{detail.orderNo}</span>
        </div>
        <div>
          <span className="text-muted-foreground">
            {lang === 'zh' ? '類型：' : 'Type: '}
          </span>
          <span>
            {TYPE_LABELS[detail.type]
              ? lang === 'zh'
                ? TYPE_LABELS[detail.type].zh
                : TYPE_LABELS[detail.type].en
              : detail.type}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">
            {lang === 'zh' ? '退款金額：' : 'Refund: '}
          </span>
          <span className="font-mono text-price font-semibold">
            {formatPrice(detail.refundAmount)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">
            {lang === 'zh' ? '狀態：' : 'Status: '}
          </span>
          <Badge variant="outline" className={STATUS_COLORS[detail.status] || ''}>
            {statusLabel(detail.status)}
          </Badge>
        </div>
        <div>
          <span className="text-muted-foreground">
            {lang === 'zh' ? '申請時間：' : 'Apply: '}
          </span>
          <span>{formatDate(detail.createdAt)}</span>
        </div>
      </div>

      <div className="text-sm">
        <div className="text-muted-foreground mb-1">
          {lang === 'zh' ? '退款原因：' : 'Reason: '}
        </div>
        <div>{detail.reason}</div>
        {detail.description && (
          <div className="mt-2 text-muted-foreground">{detail.description}</div>
        )}
      </div>

      {detail.images && detail.images.length > 0 && (
        <div className="text-sm">
          <div className="text-muted-foreground mb-2">
            {lang === 'zh' ? '憑證圖片：' : 'Voucher Images: '}
          </div>
          <div className="flex gap-2 flex-wrap">
            {detail.images.map((img) => (
              <img
                key={img.id}
                src={img.imageUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-md border border-border"
              />
            ))}
          </div>
        </div>
      )}

      {detail.rejectReason && (
        <div className="text-sm bg-red-50 p-3 rounded-md">
          <div className="text-red-700 font-medium mb-1">
            {lang === 'zh' ? '拒絕原因：' : 'Reject Reason: '}
          </div>
          <div className="text-red-600">{detail.rejectReason}</div>
        </div>
      )}
    </div>
  );
};

export default AfterSalesDetailContent;
