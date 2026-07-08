import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Gift, Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import CouponCard from '@client/src/components/CouponCard/CouponCard';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { getMyCoupons } from '@client/src/api/coupon';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { UserCoupon } from '@shared/api.interface';

type TabType = 'unused' | 'used' | 'expired';

const TABS: { key: TabType; labelZh: string; labelEn: string }[] = [
  { key: 'unused', labelZh: '未使用', labelEn: 'Unused' },
  { key: 'used', labelZh: '已使用', labelEn: 'Used' },
  { key: 'expired', labelZh: '已過期', labelEn: 'Expired' },
];

const MyCoupons = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('unused');
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCoupons(activeTab);
      setCoupons(data || []);
    } catch (err) {
      logger.error('load my coupons error', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleUse = (userCouponId: string) => {
    logger.info(`use coupon: ${userCouponId}`);
    navigate('/products');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {lang === 'zh' ? '我的優惠券' : 'My Coupons'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'zh'
              ? `共 ${coupons.length} 張優惠券`
              : `${coupons.length} coupon(s) total`}
          </p>
        </div>
      </div>

      {/* 状态 Tab */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-lg">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'zh' ? tab.labelZh : tab.labelEn}
          </button>
        ))}
      </div>

      {/* 优惠券列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-border">
          <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {activeTab === 'unused'
              ? lang === 'zh'
                ? '暫無可用優惠券'
                : 'No available coupons'
              : activeTab === 'used'
                ? lang === 'zh'
                  ? '暫無已使用優惠券'
                  : 'No used coupons'
                : lang === 'zh'
                  ? '暫無已過期優惠券'
                  : 'No expired coupons'}
          </p>
          {activeTab === 'unused' && (
            <Button
              variant="default"
              onClick={() => navigate('/coupons')}
            >
              {lang === 'zh' ? '去領券' : 'Get Coupons'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((uc: UserCoupon) => {
            if (!uc.coupon) return null;
            return (
              <CouponCard
                key={uc.id}
                coupon={uc.coupon}
                status={uc.status}
                userCouponId={uc.id}
                showAction={uc.status === 'unused'}
                onUse={handleUse}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCoupons;
