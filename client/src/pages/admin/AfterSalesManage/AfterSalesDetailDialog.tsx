import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Package, RefreshCw } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Badge } from '@client/src/components/ui/badge';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { AfterSales } from '@shared/api.interface';
import AfterSalesRejectDialog from './AfterSalesRejectDialog';
import AfterSalesDetailContent from './AfterSalesDetailContent';

interface AfterSalesDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: AfterSales | null;
  loading: boolean;
  onRefresh: () => void;
}

const AfterSalesDetailDialog = ({
  open,
  onOpenChange,
  detail,
  loading,
  onRefresh,
}: AfterSalesDetailDialogProps) => {
  const { lang } = useLanguage();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleApproveRefund = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await fetch(`/api/admin/after-sales/${detail.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      onOpenChange(false);
      onRefresh();
    } catch (err) {
      logger.error('approve refund error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReturn = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await fetch(`/api/admin/after-sales/${detail.id}/approve-return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      onOpenChange(false);
      onRefresh();
    } catch (err) {
      logger.error('approve return error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await fetch(`/api/admin/after-sales/${detail.id}/confirm-return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      onOpenChange(false);
      onRefresh();
    } catch (err) {
      logger.error('confirm return error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRefund = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await fetch(`/api/admin/after-sales/${detail.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      onOpenChange(false);
      onRefresh();
    } catch (err) {
      logger.error('complete refund error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSuccess = () => {
    setRejectOpen(false);
    onOpenChange(false);
    onRefresh();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {lang === 'zh' ? '售後詳情' : 'After-Sales Detail'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-2">
            <AfterSalesDetailContent detail={detail} loading={loading} />
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <DialogClose asChild>
              <Button variant="outline">{lang === 'zh' ? '關閉' : 'Close'}</Button>
            </DialogClose>
            {detail?.status === 'pending' && (
              <>
                {detail.type === 'refund_only' ? (
                  <Button onClick={handleApproveRefund} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <CheckCircle className="w-4 h-4" />
                    {lang === 'zh' ? '同意退款' : 'Approve Refund'}
                  </Button>
                ) : (
                  <Button onClick={handleApproveReturn} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Package className="w-4 h-4" />
                    {lang === 'zh' ? '同意退貨' : 'Approve Return'}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={submitting}
                >
                  <XCircle className="w-4 h-4" />
                  {lang === 'zh' ? '拒絕' : 'Reject'}
                </Button>
              </>
            )}
            {detail?.status === 'returning' && detail.type === 'return_refund' && (
              <Button onClick={handleConfirmReturn} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <RefreshCw className="w-4 h-4" />
                {lang === 'zh' ? '確認收到退貨' : 'Confirm Return Received'}
              </Button>
            )}
            {(detail?.status === 'approved' || detail?.status === 'returning') &&
              detail?.type === 'return_refund' && (
                <Button onClick={handleCompleteRefund} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'zh' ? '完成退款' : 'Complete Refund'}
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AfterSalesRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        afterSalesId={detail?.id || ''}
        onSuccess={handleRejectSuccess}
      />
    </>
  );
};

export default AfterSalesDetailDialog;
