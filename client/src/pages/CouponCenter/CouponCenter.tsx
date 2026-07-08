import { useState, useEffect, useCallback } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CouponCard from '@client/src/components/CouponCard/CouponCard';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { getAvailableCoupons, claimCoupon } from '@client/src/api/coupon';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Coupon } from '@shared/api.interface';

type TabType = 'all' | 'fixed' | 'percent' | 'shipping';

const TABS: { key: TabType; labelZh: string; labelEn: string }[] = [
  { key: 'all', labelZh: '全部', labelEn: 'All' },
  { key: 'fixed', labelZh: '滿減券', labelEn: 'Discount' },
  { key: 'percent', labelZh: '折扣券', labelEn: 'Percent Off' },
  { key: 'shipping', labelZh: '免運券', labelEn: 'Free Shipping' },
];

const CouponCenter = () => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAvailableCoupons(1, 50);
      setCoupons(data.items || []);
    } catch (err) {
      logger.error('load coupons error', err);
      toast.error(lang === 'zh' ? '加載失敗' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleClaim = async (couponId: string) => {
    if (claimingId || claimedIds.has(couponId)) return;
    try {
      setClaimingId(couponId);
      await claimCoupon(couponId);
      setClaimedIds((prev) => new Set(prev).add(couponId));
      toast.success(lang === 'zh' ? '領取成功！' : 'Coupon claimed!');
    } catch (err) {
      logger.error('claim coupon error', err);
      toast.error(lang === 'zh' ? '領取失敗' : 'Claim failed');
    } finally {
      setClaimingId(null);
    }
  };

  const filteredCoupons =
    activeTab === 'all'
      ? coupons
      : coupons.filter((c: Coupon) => c.type === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* 顶部标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === 'zh' ? '領券中心' : 'Coupon Center'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === 'zh'
                ? '精選優惠券，領取後即可使用'
                : 'Grab exclusive coupons and save more'}
            </p>
          </div>
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-white border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {lang === 'zh' ? tab.labelZh : tab.labelEn}
          </button>
        ))}
      </div>

      {/* 优惠券网格 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-20">
          <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {lang === 'zh' ? '暫無可用優惠券' : 'No available coupons'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon: Coupon) => {
            const isSoldOut =
              coupon.totalQuantity > 0 &&
              coupon.usedQuantity >= coupon.totalQuantity;
            const isClaimed = claimedIds.has(coupon.id);
            return (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                showAction
                soldOut={isSoldOut}
                claimed={isClaimed}
                onClaim={handleClaim}
              />
            );
          })}
        </div>
      )}

      {claimingId && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <span className="text-sm">
              {lang === 'zh' ? '領取中...' : 'Claiming...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponCenter;
