import { useRef, useState } from 'react';
import { Download, X, Loader2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Receipt, OrderItem } from '@shared/api.interface';

interface ReceiptPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: (Receipt & { items?: OrderItem[]; order?: { totalAmount: number; discountAmount: number; shippingFee: number; payAmount: number } }) | null;
  loading?: boolean;
}

const PAYMENT_LABELS: Record<string, { zh: string; en: string }> = {
  fps: { zh: 'FPS 轉數快', en: 'FPS' },
  payme: { zh: 'PayMe', en: 'PayMe' },
  bank_transfer: { zh: '銀行轉賬', en: 'Bank Transfer' },
  alipay_hk: { zh: 'AlipayHK', en: 'AlipayHK' },
};

const ReceiptPreview = ({ open, onOpenChange, receipt, loading }: ReceiptPreviewProps) => {
  const { lang } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (val: number | string) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const paymentLabel = (method: string) => {
    if (!method) return '-';
    const label = PAYMENT_LABELS[method];
    return label ? (lang === 'zh' ? label.zh : label.en) : method;
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`receipt-${receipt?.receiptNo || 'receipt'}.pdf`);
    } catch (err) {
      logger.error('download receipt pdf failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const items = receipt?.items || [];
  const order = receipt?.order;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {lang === 'zh' ? '電子收據' : 'E-Receipt'}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !receipt ? (
            <div className="text-center py-20 text-muted-foreground">
              {lang === 'zh' ? '暫無收據' : 'No receipt available'}
            </div>
          ) : (
            <div ref={receiptRef} className="bg-white p-6 text-foreground">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b border-border">
                <h2 className="text-xl font-bold text-primary">
                  {lang === 'zh' ? '香港生活百貨' : 'Hong Kong Lifestyle Store'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'zh' ? '電子收據' : 'E-Receipt'}
                </p>
              </div>

              {/* Receipt Info */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                <div>
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '收據編號：' : 'Receipt No.: '}
                  </span>
                  <span className="font-mono font-medium">{receipt.receiptNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '訂單號：' : 'Order No.: '}
                  </span>
                  <span className="font-mono font-medium">{receipt.orderNo}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '購買日期：' : 'Purchase Date: '}
                  </span>
                  <span>{receipt.issuedAt ? formatDate(receipt.issuedAt) : '-'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">
                        {lang === 'zh' ? '商品' : 'Item'}
                      </th>
                      <th className="text-center py-2 font-medium text-muted-foreground w-16">
                        {lang === 'zh' ? '數量' : 'Qty'}
                      </th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-24">
                        {lang === 'zh' ? '單價' : 'Price'}
                      </th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-24">
                        {lang === 'zh' ? '小計' : 'Subtotal'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2">
                          <div className="font-medium">
                            {lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                          </div>
                          {Object.keys(item.spec || {}).length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {Object.values(item.spec).join(' / ')}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2 font-mono">
                          {formatPrice(item.salePrice)}
                        </td>
                        <td className="text-right py-2 font-mono">
                          {formatPrice(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Amount Summary */}
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '商品金額' : 'Subtotal'}
                  </span>
                  <span className="font-mono">
                    {formatPrice(order?.totalAmount ?? receipt.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '運費' : 'Shipping Fee'}
                  </span>
                  <span className="font-mono">{formatPrice(order?.shippingFee ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '優惠' : 'Discount'}
                  </span>
                  <span className="font-mono text-accent">
                    -{formatPrice(order?.discountAmount ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
                  <span>{lang === 'zh' ? '實付金額' : 'Total Paid'}</span>
                  <span className="font-mono text-price text-lg">
                    {formatPrice(order?.payAmount ?? receipt.amount)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-4 pt-4 border-t border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '收款方式' : 'Payment Method'}
                  </span>
                  <span>{paymentLabel(receipt.paymentMethod || '')}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground text-center space-y-1">
                <p>
                  {lang === 'zh'
                    ? '香港生活百貨有限公司 · 商業登記號碼：BR12345678'
                    : 'Hong Kong Lifestyle Store Limited · BR No.: BR12345678'}
                </p>
                <p>
                  {lang === 'zh'
                    ? '地址：香港九龍旺角彌敦道 123 號生活廣場 5 樓'
                    : 'Address: 5/F, Lifestyle Plaza, 123 Nathan Road, Mong Kok, KLN, HK'}
                </p>
                <p>
                  {lang === 'zh'
                    ? '電話：+852 2345 6789 · 電郵：support@hklifestore.hk'
                    : 'Tel: +852 2345 6789 · Email: support@hklifestore.hk'}
                </p>
                <p className="mt-2">
                  {lang === 'zh'
                    ? '此為電子收據，請妥善保存。如有任何問題，請聯絡客戶服務。'
                    : 'This is an electronic receipt. Please keep it for your records. For inquiries, contact customer service.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <DialogClose asChild>
            <Button variant="outline">
              {lang === 'zh' ? '關閉' : 'Close'}
            </Button>
          </DialogClose>
          <Button onClick={handleDownloadPDF} disabled={downloading || !receipt}>
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {lang === 'zh' ? '下載 PDF' : 'Download PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreview;
