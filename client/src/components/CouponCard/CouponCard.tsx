import { useNavigate } from 'react-router-dom';
import { Ticket, Percent, Truck, Check } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { Coupon, UserCoupon } from '@shared/api.interface';

export interface CouponCardProps {
  coupon: Coupon;
  /** 优惠券状态：unused/used/expired，不传则为可领取态 */
  status?: 'unused' | 'used' | 'expired';
  /** 是否显示操作按钮 */
  showAction?: boolean;
  /** 领取回调（领券中心用） */
  onClaim?: (couponId: string) => void;
  /** 使用回调（我的优惠券用） */
  onUse?: (couponId: string) => void;
  /** 是否已领取（领券中心用） */
  claimed?: boolean;
  /** 是否已领完（领券中心用） */
  soldOut?: boolean;
  /** 是否可选择（结算弹窗用） */
  selectable?: boolean;
  /** 是否选中 */
  selected?: boolean;
  /** 选择回调 */
  onSelect?: (couponId: string) => void;
  /** 用户券 id（结算时用） */
  userCouponId?: string;
}

const CouponCard = ({
  coupon,
  status,
  showAction = true,
  onClaim,
  onUse,
  claimed,
  soldOut,
  selectable,
  selected,
  onSelect,
  userCouponId,
}: CouponCardProps) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const isDisabled = status === 'used' || status === 'expired' || soldOut;

  // 左侧面额区颜色
  const getLeftBgClass = () => {
    if (isDisabled) return 'bg-muted';
    switch (coupon.type) {
      case 'fixed':
        return 'bg-gradient-to-br from-[hsl(5,78%,52%)] to-[hsl(5,78%,42%)]';
      case 'percent':
        return 'bg-gradient-to-br from-[hsl(160,55%,42%)] to-[hsl(160,55%,32%)]';
      case 'shipping':
        return 'bg-gradient-to-br from-[hsl(215,65%,32%)] to-[hsl(215,65%,22%)]';
      default:
        return 'bg-primary';
    }
  };

  // 面额显示
  const renderAmount = () => {
    switch (coupon.type) {
      case 'fixed':
        return (
          <div className="text-white text-center">
            <span className="text-lg font-medium align-top">HK$</span>
            <span className="text-4xl font-bold font-mono leading-none">
              {coupon.discountValue}
            </span>
          </div>
        );
      case 'percent':
        return (
          <div className="text-white text-center">
            <span className="text-4xl font-bold font-mono leading-none">
              {(coupon.discountValue * 10).toFixed(1)}
            </span>
            <span className="text-lg font-medium">
              {lang === 'zh' ? '折' : '% OFF'}
            </span>
          </div>
        );
      case 'shipping':
        return (
          <div className="text-white text-center flex flex-col items-center gap-1">
            <Truck className="w-8 h-8" />
            <span className="text-xl font-bold">
              {lang === 'zh' ? '免運' : 'FREE'}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  // 类型图标
  const renderTypeIcon = () => {
    switch (coupon.type) {
      case 'fixed':
        return <Ticket className="w-3 h-3" />;
      case 'percent':
        return <Percent className="w-3 h-3" />;
      case 'shipping':
        return <Truck className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // 类型标签文字
  const getTypeLabel = () => {
    switch (coupon.type) {
      case 'fixed':
        return lang === 'zh' ? '滿減券' : 'Discount';
      case 'percent':
        return lang === 'zh' ? '折扣券' : 'Percent Off';
      case 'shipping':
        return lang === 'zh' ? '免運券' : 'Free Shipping';
      default:
        return '';
    }
  };

  // 使用条件
  const getConditionText = () => {
    if (coupon.minAmount > 0) {
      return lang === 'zh'
        ? `滿 HK$${coupon.minAmount.toFixed(0)} 可用`
        : `Min. spend HK$${coupon.minAmount.toFixed(0)}`;
    }
    return lang === 'zh' ? '無門檻可用' : 'No minimum spend';
  };

  // 有效期
  const getValidText = () => {
    if (coupon.validType === 'days' && coupon.validDays) {
      return lang === 'zh'
        ? `領取後 ${coupon.validDays} 天內有效`
        : `Valid for ${coupon.validDays} days after claim`;
    }
    if (coupon.startTime && coupon.endTime) {
      const start = coupon.startTime.slice(0, 10);
      const end = coupon.endTime.slice(0, 10);
      return `${start} - ${end}`;
    }
    return '';
  };

  // 状态徽章文字
  const getStatusBadge = () => {
    if (status === 'used') return lang === 'zh' ? '已使用' : 'Used';
    if (status === 'expired') return lang === 'zh' ? '已過期' : 'Expired';
    if (soldOut) return lang === 'zh' ? '已搶完' : 'Sold Out';
    if (claimed) return lang === 'zh' ? '已領取' : 'Claimed';
    return '';
  };

  const handleUse = () => {
    if (onUse) {
      onUse(userCouponId || coupon.id);
    } else {
      navigate('/products');
    }
  };

  const handleCardClick = () => {
    if (selectable && onSelect && !isDisabled) {
      onSelect(userCouponId || coupon.id);
    }
  };

  return (
    <div
      className={`relative flex rounded-lg overflow-hidden border border-border bg-white transition-all ${
        selectable && !isDisabled ? 'cursor-pointer hover:shadow-md' : ''
      } ${selected ? 'ring-2 ring-accent border-accent' : ''}`}
      onClick={handleCardClick}
    >
      {/* 左侧面额区 */}
      <div
        className={`relative w-28 sm:w-32 flex-shrink-0 flex flex-col items-center justify-center py-4 ${getLeftBgClass()}`}
      >
        {renderAmount()}
        {/* 半圆缺口效果 */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white" />
        {/* 状态蒙版 */}
        {isDisabled && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-medium rotate-[-15deg] border border-muted-foreground/40 px-2 py-0.5 rounded">
              {getStatusBadge()}
            </span>
          </div>
        )}
      </div>

      {/* 中间虚线分隔 */}
      <div className="w-0 border-l-2 border-dashed border-border relative z-10">
        <div className="absolute -top-2 -left-[7px] w-3 h-3 rounded-full bg-background" />
        <div className="absolute -bottom-2 -left-[7px] w-3 h-3 rounded-full bg-background" />
      </div>

      {/* 右侧信息区 */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
              {lang === 'zh' ? coupon.nameZh : coupon.nameEn}
            </h3>
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent flex-shrink-0">
              {renderTypeIcon()}
              {getTypeLabel()}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            {getConditionText()}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {getValidText()}
          </p>
        </div>

        {showAction && (
          <div className="mt-3 flex justify-end">
            {status === 'unused' && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUse();
                }}
              >
                {lang === 'zh' ? '立即使用' : 'Use Now'}
              </Button>
            )}
            {!status && !selectable && (
              <Button
                size="sm"
                variant={claimed || soldOut ? 'outline' : 'default'}
                className="h-7 text-xs px-3"
                disabled={claimed || soldOut}
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim?.(coupon.id);
                }}
              >
                {soldOut
                  ? lang === 'zh'
                    ? '已搶完'
                    : 'Sold Out'
                  : claimed
                    ? lang === 'zh'
                      ? '已領取'
                      : 'Claimed'
                    : lang === 'zh'
                      ? '立即領取'
                      : 'Claim Now'}
              </Button>
            )}
            {selectable && selected && (
              <div className="text-accent text-sm font-medium flex items-center gap-1">
                <Check className="w-4 h-4" />
                {lang === 'zh' ? '已選擇' : 'Selected'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponCard;
