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
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Coupon } from '@shared/api.interface';
import CouponFormFields from './CouponFormFields';

interface CouponForm {
  nameZh: string;
  nameEn: string;
  type: 'fixed' | 'percent' | 'shipping';
  discountValue: number;
  minAmount: number;
  applicableScope: 'all' | 'category' | 'product';
  validType: 'fixed' | 'days';
  validDays: number;
  startTime: string;
  endTime: string;
  totalQuantity: number;
  perUserLimit: number;
}

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCoupon: Coupon | null;
  onSuccess: () => void;
}

const defaultForm: CouponForm = {
  nameZh: '',
  nameEn: '',
  type: 'fixed',
  discountValue: 0,
  minAmount: 0,
  applicableScope: 'all',
  validType: 'fixed',
  validDays: 7,
  startTime: '',
  endTime: '',
  totalQuantity: 100,
  perUserLimit: 1,
};

const CouponFormDialog = ({
  open,
  onOpenChange,
  editingCoupon,
  onSuccess,
}: CouponFormDialogProps) => {
  const { lang } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CouponForm>(defaultForm);

  const getInitialForm = (): CouponForm => {
    if (editingCoupon) {
      return {
        nameZh: editingCoupon.nameZh,
        nameEn: editingCoupon.nameEn,
        type: editingCoupon.type,
        discountValue: editingCoupon.discountValue,
        minAmount: editingCoupon.minAmount,
        applicableScope: editingCoupon.applicableScope,
        validType: editingCoupon.validType,
        validDays: editingCoupon.validDays || 7,
        startTime: editingCoupon.startTime ? editingCoupon.startTime.slice(0, 16) : '',
        endTime: editingCoupon.endTime ? editingCoupon.endTime.slice(0, 16) : '',
        totalQuantity: editingCoupon.totalQuantity,
        perUserLimit: editingCoupon.perUserLimit,
      };
    }
    return defaultForm;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      logger.error('save coupon error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setForm(getInitialForm());
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingCoupon
              ? lang === 'zh'
                ? '編輯優惠券'
                : 'Edit Coupon'
              : lang === 'zh'
                ? '新建優惠券'
                : 'New Coupon'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-2">
          <CouponFormFields form={form} onChange={setForm} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.nameZh.trim() || !form.nameEn.trim()}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'zh' ? '保存' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CouponFormDialog;
