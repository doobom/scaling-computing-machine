import { WifiOff, CreditCard, RefreshCw, Headphones, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

/**
 * 通用 ErrorState 组件
 */
export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: ErrorStateProps) {
  const { lang } = useLanguage();

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <WifiOff className="w-10 h-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title ?? (lang === 'zh' ? '出了點問題' : 'Something went wrong')}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {description}
        </p>
      )}
      <div className="flex gap-3">
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {secondaryActionLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

interface NetworkErrorProps {
  onRetry: () => void;
  description?: string;
  className?: string;
}

/**
 * NetworkError：网络错误状态，带重试按钮
 */
export function NetworkError({
  onRetry,
  description,
  className = '',
}: NetworkErrorProps) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <ErrorState
      title={lang === 'zh' ? '網絡連接失敗' : 'Network Error'}
      description={
        description ??
        (lang === 'zh'
          ? '請檢查網絡連接後重試'
          : 'Please check your connection and try again')
      }
      actionLabel={lang === 'zh' ? '重新加載' : 'Retry'}
      onAction={onRetry}
      secondaryActionLabel={lang === 'zh' ? '返回首頁' : 'Go Home'}
      onSecondaryAction={() => navigate('/')}
      className={className}
    />
  );
}

interface PaymentErrorProps {
  onRetry: () => void;
  orderNo?: string;
  description?: string;
  className?: string;
}

/**
 * PaymentError：支付失败状态，带重新支付按钮和客服信息
 */
export function PaymentError({
  onRetry,
  orderNo,
  description,
  className = '',
}: PaymentErrorProps) {
  const { lang } = useLanguage();

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <CreditCard className="w-10 h-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {lang === 'zh' ? '支付失敗' : 'Payment Failed'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-2">
        {description ??
          (lang === 'zh'
            ? '支付過程中出現問題，請重試或聯繫客服'
            : 'Payment encountered an issue, please retry or contact support')}
      </p>
      {orderNo && (
        <p className="text-xs text-muted-foreground font-mono mb-6">
          {lang === 'zh' ? '訂單編號：' : 'Order No: '}
          {orderNo}
        </p>
      )}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {lang === 'zh' ? '重新支付' : 'Retry Payment'}
        </Button>
      </div>
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Headphones className="w-4 h-4 text-accent" />
        <span>
          {lang === 'zh'
            ? '客服熱線：+852 9999 9999'
            : 'Support: +852 9999 9999'}
        </span>
      </div>
    </div>
  );
}

export default ErrorState;
