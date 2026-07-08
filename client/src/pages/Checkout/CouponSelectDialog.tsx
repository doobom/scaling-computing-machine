import { Ticket, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import CouponCard from '@client/src/components/CouponCard/CouponCard';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { UserCoupon } from '@shared/api.interface';

export interface CouponSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupons: UserCoupon[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (userCouponId: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}

const CouponSelectDialog = ({
  open,
  onOpenChange,
  coupons,
  loading,
  selectedId,
  onSelect,
  onConfirm,
  onClear,
}: CouponSelectDialogProps) => {
  const { lang } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-accent" />
            {lang === 'zh' ? '選擇優惠券' : 'Select Coupon'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {lang === 'zh'
                  ? '暫無可用優惠券'
                  : 'No available coupons for this order'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((uc: UserCoupon) => {
                if (!uc.coupon) return null;
                return (
                  <CouponCard
                    key={uc.id}
                    coupon={uc.coupon}
                    status="unused"
                    userCouponId={uc.id}
                    showAction={false}
                    selectable
                    selected={selectedId === uc.id}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0 pt-2 border-t border-border">
          {selectedId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              {lang === 'zh' ? '不使用優惠券' : 'Do not use'}
            </Button>
          )}
          <Button onClick={onConfirm}>
            {lang === 'zh' ? '確認' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CouponSelectDialog;
