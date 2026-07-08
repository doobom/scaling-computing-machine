import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Upload,
  X,
  Loader2,
  DollarSign,
  FileText,
} from 'lucide-react';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { createAfterSales } from '@client/src/api/after-sales';
import { getMemberOrderDetail } from '@client/src/api/member';
import type { OrderDetail } from '@client/src/api/member';
import type { CreateAfterSalesRequest } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const REASON_OPTIONS = [
  { value: 'quality', labelZh: '質量問題', labelEn: 'Quality Issue' },
  { value: 'wrong_item', labelZh: '發錯貨', labelEn: 'Wrong Item' },
  { value: 'not_wanted', labelZh: '不想要了', labelEn: "Don't Want" },
  { value: 'other', labelZh: '其他', labelEn: 'Other' },
];

const AfterSalesApply = () => {
  const { lang } = useLanguage();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<'refund_only' | 'return_refund'>('refund_only');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [images, setImages] = useState<{ url: string; filePath?: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getMemberOrderDetail(orderId);
      setOrder(data);
      setRefundAmount(data.payAmount);
    } catch (err) {
      logger.error('Failed to load order for after-sales', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 3) {
      logger.warn('Maximum 3 images allowed');
      return;
    }
    try {
      setUploading(true);
      const dataloom = await getDataloom();
      const newImages: { url: string; filePath?: string }[] = [];
      for (const file of Array.from(files)) {
        const { data, error } = await dataloom
          .storage
          .from(getDefaultBucketId())
          .uploadFile(file);
        if (error || !data) {
          logger.error('upload file error', error);
          continue;
        }
        newImages.push({
          url: data.download_url,
          filePath: data.file_path,
        });
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      logger.error('Upload image failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!orderId || !reason || !refundAmount) return;
    const amount = Number(refundAmount);
    const maxAmount = Number(order?.payAmount || 0);
    if (isNaN(amount) || amount <= 0 || amount > maxAmount) return;

    try {
      setSubmitting(true);
      const data: CreateAfterSalesRequest = {
        orderId,
        type,
        reason:
          REASON_OPTIONS.find((r) => r.value === reason)?.[
            lang === 'zh' ? 'labelZh' : 'labelEn'
          ] || reason,
        description: description || undefined,
        refundAmount: amount,
        images: images.map((img) => img.filePath || img.url),
      };
      const result = await createAfterSales(data);
      navigate(`/member/after-sales/${result.id}`);
    } catch (err) {
      logger.error('Submit after-sales failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const maxRefund = Number(order?.payAmount || 0);
  const currentAmount = Number(refundAmount) || 0;
  const amountValid = currentAmount > 0 && currentAmount <= maxRefund;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{lang === 'zh' ? '訂單不存在' : 'Order not found'}</p>
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
        <h1 className="text-xl font-bold text-foreground">
          {lang === 'zh' ? '申請售後' : 'Apply After-Sales'}
        </h1>
      </div>

      {/* Order product info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '商品資訊' : 'Product Info'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.productImageUrl ? (
                    <img
                      src={item.productImageUrl}
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
                    {lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'zh' ? '數量' : 'Qty'}: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-price font-mono">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lang === 'zh' ? '訂單實付' : 'Order Total'}
            </span>
            <span className="font-semibold text-price font-mono">
              {formatPrice(order.payAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* After-sales type */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '售後類型' : 'After-Sales Type'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={type}
            onValueChange={(val) =>
              setType(val as 'refund_only' | 'return_refund')
            }
            className="grid grid-cols-2 gap-3"
          >
            <div>
              <RadioGroupItem
                value="refund_only"
                id="type-refund"
                className="peer sr-only"
              />
              <Label
                htmlFor="type-refund"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-colors"
              >
                <DollarSign className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-medium">
                  {lang === 'zh' ? '僅退款' : 'Refund Only'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {lang === 'zh' ? '無需退貨' : 'No return needed'}
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="return_refund"
                id="type-return"
                className="peer sr-only"
              />
              <Label
                htmlFor="type-return"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-colors"
              >
                <Package className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-medium">
                  {lang === 'zh' ? '退貨退款' : 'Return & Refund'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {lang === 'zh' ? '需寄回商品' : 'Return item required'}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Reason */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '退款原因' : 'Refund Reason'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">
              {lang === 'zh' ? '選擇原因' : 'Select Reason'}
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    lang === 'zh' ? '請選擇退款原因' : 'Select a reason'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {lang === 'zh' ? opt.labelZh : opt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">
              {lang === 'zh' ? '問題描述' : 'Description'}
              <span className="text-muted-foreground ml-1">
                ({lang === 'zh' ? '選填' : 'optional'})
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lang === 'zh'
                  ? '請詳細描述問題，以便我們更快處理'
                  : 'Describe the issue in detail'
              }
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '憑證圖片' : 'Evidence Images'}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              ({lang === 'zh' ? '最多3張' : 'max 3'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden bg-muted relative"
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">
                      {lang === 'zh' ? '上傳圖片' : 'Upload'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Refund amount */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            {lang === 'zh' ? '退款金額' : 'Refund Amount'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-price font-mono">HK$</span>
            <Input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="text-xl font-semibold font-mono"
              min="0"
              max={maxRefund}
              step="0.01"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {lang === 'zh'
              ? `最多可退 ${formatPrice(maxRefund)}`
              : `Max refund: ${formatPrice(maxRefund)}`}
          </p>
          {!amountValid && refundAmount && (
            <p className="text-xs text-destructive mt-1">
              {lang === 'zh'
                ? '退款金額不能超過訂單實付金額'
                : 'Refund cannot exceed order total'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 md:static md:mt-6 md:p-0 md:border-0">
        <div className="max-w-3xl mx-auto">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={
              !reason ||
              !amountValid ||
              submitting ||
              uploading
            }
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'zh' ? '提交申請' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AfterSalesApply;
