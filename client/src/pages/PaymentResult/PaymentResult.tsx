import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getPaymentByOrder,
  retryPayment,
  uploadVoucher,
  getPaymentMethods,
  type PaymentInfo,
} from '@client/src/api/payment';
import BankTransferSection from './BankTransferSection';

const POLL_INTERVAL = 30000; // 30 seconds

const PaymentResult = () => {
  const navigate = useNavigate();
  const { orderId = '' } = useParams<{ orderId: string }>();
  const { lang } = useLanguage();

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voucherUrl, setVoucherUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bankInfo, setBankInfo] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
  } | null>(null);

  // Fetch bank transfer info from payment methods config
  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const methods = await getPaymentMethods();
        const bankMethod = methods.find((m) => m.key === 'bank_transfer');
        if (bankMethod?.config) {
          setBankInfo({
            bankName: String(bankMethod.config.bankName ?? ''),
            accountNumber: String(bankMethod.config.accountNumber ?? ''),
            accountName: String(bankMethod.config.accountName ?? ''),
            bankCode: String(bankMethod.config.bankCode ?? ''),
          });
        }
      } catch (err) {
        logger.error(`Failed to fetch bank info: ${String(err)}`);
      }
    };
    fetchBankInfo();
  }, []);

  const fetchPaymentInfo = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getPaymentByOrder(orderId);
      setPayment(data);
    } catch (err) {
      logger.error(`Failed to fetch payment info: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handleRefresh = useCallback(async () => {
    if (!orderId) return;
    setRefreshing(true);
    try {
      const data = await getPaymentByOrder(orderId);
      setPayment(data);
    } catch (err) {
      logger.error(`Failed to refresh payment status: ${String(err)}`);
    } finally {
      setRefreshing(false);
    }
  }, [orderId]);

  const handleRetry = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await retryPayment(orderId);
      setPayment(data);
    } catch (err) {
      logger.error(`Failed to retry payment: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handleUploadVoucher = useCallback(async () => {
    if (!orderId || !voucherUrl.trim()) return;
    setUploading(true);
    try {
      const data = await uploadVoucher(orderId, voucherUrl.trim());
      setPayment(data);
      setVoucherUrl('');
    } catch (err) {
      logger.error(`Failed to upload voucher: ${String(err)}`);
    } finally {
      setUploading(false);
    }
  }, [orderId, voucherUrl]);

  useEffect(() => {
    fetchPaymentInfo();
  }, [fetchPaymentInfo]);

  // Auto-poll for pending status (every 30 seconds)
  useEffect(() => {
    if (payment?.status !== 'pending') return;
    const timer = setInterval(() => {
      handleRefresh();
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [payment?.status, handleRefresh]);

  // Auto-redirect to order detail when payment succeeds
  useEffect(() => {
    if (payment?.status === 'success' && orderId) {
      const redirectTimer = setTimeout(() => {
        navigate(`/member/orders`);
      }, 3000);
      return () => clearTimeout(redirectTimer);
    }
  }, [payment?.status, orderId, navigate]);

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-[hsl(160_55%_42%)]',
      bgColor: 'bg-[hsl(160_55%_42%)]/10',
      borderColor: 'border-[hsl(160_55%_42%)]/20',
      titleZh: '支付成功',
      titleEn: 'Payment Successful',
      descZh: '感謝您的購買，我們會盡快為您發貨',
      descEn: 'Thank you for your purchase. We will ship soon.',
    },
    pending: {
      icon: Clock,
      color: 'text-[hsl(38_90%_50%)]',
      bgColor: 'bg-[hsl(38_90%_50%)]/10',
      borderColor: 'border-[hsl(38_90%_50%)]/20',
      titleZh: '待支付確認',
      titleEn: 'Awaiting Payment Confirmation',
      descZh: '我們正在確認您的支付狀態，請稍候',
      descEn: 'We are confirming your payment status, please wait.',
    },
    failed: {
      icon: XCircle,
      color: 'text-[hsl(0_72%_51%)]',
      bgColor: 'bg-[hsl(0_72%_51%)]/10',
      borderColor: 'border-[hsl(0_72%_51%)]/20',
      titleZh: '支付失敗',
      titleEn: 'Payment Failed',
      descZh: '支付未能完成，請重試或聯繫客服',
      descEn: 'Payment failed. Please retry or contact customer service.',
    },
    refunded: {
      icon: Clock,
      color: 'text-[hsl(38_90%_50%)]',
      bgColor: 'bg-[hsl(38_90%_50%)]/10',
      borderColor: 'border-[hsl(38_90%_50%)]/20',
      titleZh: '已退款',
      titleEn: 'Refunded',
      descZh: '款項已退回您的支付賬戶',
      descEn: 'The amount has been refunded to your account.',
    },
  };

  const status = (payment?.status || 'pending') as keyof typeof statusConfig;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const isBankTransfer = payment?.paymentMethod === 'bank_transfer';

  const paymentMethodLabels: Record<string, { zh: string; en: string }> = {
    fps: { zh: '轉數快 FPS', en: 'FPS' },
    payme: { zh: 'PayMe', en: 'PayMe' },
    bank_transfer: { zh: '銀行轉賬', en: 'Bank Transfer' },
    alipay_hk: { zh: '支付寶香港', en: 'AlipayHK' },
  };

  const methodLabel = payment?.paymentMethod
    ? paymentMethodLabels[payment.paymentMethod]?.[
        lang === 'zh' ? 'zh' : 'en'
      ] || payment.paymentMethod
    : '';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-muted-foreground">
          {lang === 'zh' ? '載入中...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border-border shadow-sm">
        <CardHeader className="text-center pb-4">
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-full ${config.bgColor} flex items-center justify-center`}
          >
            <StatusIcon className={`w-10 h-10 ${config.color}`} />
          </div>
          <CardTitle className="text-2xl text-foreground">
            {lang === 'zh' ? config.titleZh : config.titleEn}
          </CardTitle>
          <CardDescription>
            {lang === 'zh' ? config.descZh : config.descEn}
          </CardDescription>
          <div className="text-sm text-muted-foreground mt-2">
            {lang === 'zh' ? '訂單編號：' : 'Order No.: '}
            <span className="font-mono text-foreground">
              {payment?.orderNo || '-'}
            </span>
          </div>
          {status === 'success' && (
            <div className="text-xs text-[hsl(160_55%_42%)] mt-2">
              {lang === 'zh'
                ? '3 秒後自動跳轉至訂單詳情...'
                : 'Redirecting to order detail in 3 seconds...'}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Summary */}
          <div className="bg-background rounded-lg p-4 space-y-3 border border-border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">
                {lang === 'zh' ? '支付金額' : 'Amount'}
              </span>
              <span className="text-xl font-semibold text-[hsl(5_78%_52%)] font-mono">
                HK${payment?.amount || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">
                {lang === 'zh' ? '支付方式' : 'Payment Method'}
              </span>
              <span className="text-foreground text-sm">{methodLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">
                {lang === 'zh' ? '預計發貨' : 'Est. Shipping'}
              </span>
              <span className="text-foreground text-sm">
                {status === 'success'
                  ? lang === 'zh'
                    ? '1-2 個工作天'
                    : '1-2 business days'
                  : lang === 'zh'
                    ? '待支付確認'
                    : 'Pending payment'}
              </span>
            </div>
          </div>

          {/* Bank Transfer Section */}
          {isBankTransfer && status === 'pending' && (
            <BankTransferSection
              bankInfo={bankInfo}
              voucherUrl={voucherUrl}
              onVoucherUrlChange={setVoucherUrl}
              onSubmit={handleUploadVoucher}
              submitting={uploading}
              hasSubmitted={!!payment?.transferVoucherUrl}
              statusColor={config.color}
              bgColor={config.bgColor}
              borderColor={config.borderColor}
            />
          )}

          {/* Refresh Status */}
          {status === 'pending' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {lang === 'zh'
                  ? '每 30 秒自動查詢支付狀態'
                  : 'Auto-check every 30 seconds'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-primary"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`}
                />
                {lang === 'zh' ? '手動刷新' : 'Refresh'}
              </Button>
            </div>
          )}

          {/* Retry for failed */}
          {status === 'failed' && (
            <Button variant="default" className="w-full" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '重新支付' : 'Retry Payment'}
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/order/${orderId}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '查看訂單' : 'View Order'}
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '繼續購物' : 'Continue Shopping'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentResult;
