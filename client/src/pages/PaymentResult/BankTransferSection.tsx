import { useState, useRef } from 'react';
import {
  Building2,
  CreditCard,
  Copy,
  Check,
  Upload,
  FileImage,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { Label } from '@client/src/components/ui/label';
import { useLanguage } from '@client/src/hooks/useLanguage';

interface BankTransferSectionProps {
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
  } | null;
  voucherUrl: string;
  onVoucherUrlChange: (url: string) => void;
  onSubmit: () => Promise<void> | void;
  submitting: boolean;
  hasSubmitted: boolean;
  statusColor: string;
  bgColor: string;
  borderColor: string;
}

const BankTransferSection = ({
  bankInfo,
  voucherUrl,
  onVoucherUrlChange,
  onSubmit,
  submitting,
  hasSubmitted,
  statusColor,
  bgColor,
  borderColor,
}: BankTransferSectionProps) => {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAccount = async () => {
    if (!bankInfo?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(bankInfo.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error(`Failed to copy: ${String(err)}`);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onVoucherUrlChange(objectUrl);
  };

  if (!bankInfo) return null;

  return (
    <div className={`rounded-lg p-4 space-y-4 border ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2">
        <Building2 className={`w-5 h-5 ${statusColor}`} />
        <h4 className="font-medium text-foreground">
          {lang === 'zh' ? '銀行轉賬資訊' : 'Bank Transfer Details'}
        </h4>
      </div>

      <div className="bg-white/60 rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {lang === 'zh' ? '銀行名稱' : 'Bank Name'}
          </span>
          <span className="text-foreground font-medium">
            {bankInfo.bankName || '-'}
          </span>
        </div>
        {bankInfo.bankCode && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'zh' ? '銀行編碼' : 'Bank Code'}
            </span>
            <span className="text-foreground font-mono">
              {bankInfo.bankCode}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {lang === 'zh' ? '賬戶號碼' : 'Account Number'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-mono font-medium">
              {bankInfo.accountNumber}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={handleCopyAccount}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[hsl(160_55%_42%)]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {lang === 'zh' ? '戶口名稱' : 'Account Name'}
          </span>
          <span className="text-foreground">
            {bankInfo.accountName || '-'}
          </span>
        </div>
      </div>

      {/* Voucher Upload */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className={`w-4 h-4 ${statusColor}`} />
          <Label className="text-sm font-medium text-foreground">
            {lang === 'zh' ? '上傳轉賬憑證' : 'Upload Transfer Voucher'}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === 'zh'
            ? '請上傳轉賬憑證截圖，我們會盡快核實'
            : 'Please upload the transfer voucher screenshot for verification.'}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {voucherUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-border bg-background">
              <img
                src={voucherUrl}
                alt={lang === 'zh' ? '轉賬憑證預覽' : 'Voucher preview'}
                className="w-full h-40 object-contain bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
                className="flex-1"
              >
                <FileImage className="w-4 h-4 mr-1.5" />
                {lang === 'zh' ? '更換圖片' : 'Change Image'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSubmit}
                disabled={submitting}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                {submitting
                  ? lang === 'zh'
                    ? '提交中...'
                    : 'Submitting...'
                  : lang === 'zh'
                    ? '提交憑證'
                    : 'Submit Voucher'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handleFileSelect}
            className="w-full border-dashed"
          >
            <Upload className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '選擇憑證圖片' : 'Choose Voucher Image'}
          </Button>
        )}

        {hasSubmitted && !voucherUrl && (
          <div className="text-xs text-[hsl(160_55%_42%)] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {lang === 'zh'
              ? '憑證已提交，等待審核'
              : 'Voucher submitted, awaiting review'}
          </div>
        )}
      </div>
    </div>
  );
};

export default BankTransferSection;
