import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface AfterSalesRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  afterSalesId: string;
  onSuccess: () => void;
}

const AfterSalesRejectDialog = ({
  open,
  onOpenChange,
  afterSalesId,
  onSuccess,
}: AfterSalesRejectDialogProps) => {
  const { lang } = useLanguage();
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReject = async () => {
    if (!afterSalesId) return;
    try {
      setSubmitting(true);
      await fetch(`/api/admin/after-sales/${afterSalesId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectReason('');
      onSuccess();
    } catch (err) {
      logger.error('reject after sales error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lang === 'zh' ? '拒絕申請' : 'Reject Application'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label>{lang === 'zh' ? '拒絕原因' : 'Reject Reason'}</Label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={lang === 'zh' ? '請輸入拒絕原因' : 'Enter reject reason'}
            className="mt-1"
            rows={4}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={submitting || !rejectReason.trim()}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'zh' ? '確認拒絕' : 'Confirm Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AfterSalesRejectDialog;
