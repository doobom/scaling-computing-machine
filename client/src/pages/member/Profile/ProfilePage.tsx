import { useState, useEffect } from 'react';
import {
  ChevronRight,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  Gift,
  Tag,
  Wallet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent } from '@client/src/components/ui/card';
import { SkeletonList } from '@client/src/components/ui/skeleton';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getMemberProfile,
  updateMemberProfile,
  getMemberOrders,
} from '@client/src/api/member';
import type { MemberProfile, OrderDetail } from '@client/src/api/member';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import MemberInfoCard from './MemberInfoCard';
import QuickEntryGrid from './QuickEntryGrid';

const STATUS_COLORS: Record<string, string> = {
  pending_pay: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_ship: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  pending_pay: { zh: '待付款', en: 'Pending' },
  pending_ship: { zh: '待發貨', en: 'Processing' },
  shipped: { zh: '已發貨', en: 'Shipped' },
  completed: { zh: '已完成', en: 'Completed' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
};

const ORDER_STATUS_TABS = [
  { key: 'pending_pay', icon: CreditCard, labelZh: '待付款', labelEn: 'To Pay' },
  { key: 'pending_ship', icon: Package, labelZh: '待發貨', labelEn: 'To Ship' },
  { key: 'shipped', icon: Truck, labelZh: '待收貨', labelEn: 'To Receive' },
  { key: 'completed', icon: CheckCircle, labelZh: '已完成', labelEn: 'Completed' },
];

const ProfilePage = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, ordersRes] = await Promise.all([
        getMemberProfile(),
        getMemberOrders({ page: 1, pageSize: 3 }),
      ]);
      setProfile(profileRes);
      setRecentOrders(ordersRes.items);
    } catch (err) {
      logger.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (data: {
    nickname?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      setSaving(true);
      const updated = await updateMemberProfile(data);
      setProfile(updated);
      toast.success(lang === 'zh' ? '資料已更新' : 'Profile updated');
    } catch (err) {
      logger.error('Failed to update profile', err);
      toast.error(lang === 'zh' ? '更新失敗' : 'Update failed');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleQuickEntry = (key: string) => {
    if (key === 'favorites') {
      navigate('/member/favorites');
    } else if (key === 'address') {
      navigate('/member/address');
    } else if (key === 'coupons') {
      navigate('/member/coupons');
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  // 计算本月节省金额（模拟，基于累计消费和折扣率）
  const monthlySavings = profile?.memberLevel?.discountRate
    ? Number(profile.totalConsumption) *
      (1 - Number(profile.memberLevel.discountRate)) *
      0.1
    : 0;

  const hasBirthdayBenefit = true; // 所有会员都有生日券权益

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 会员信息卡骨架 */}
        <div className="h-52 bg-muted rounded-lg animate-pulse" />
        {/* 订单快捷入口骨架 */}
        <div className="h-28 bg-card rounded-lg shadow-sm animate-pulse" />
        {/* 快捷入口骨架 */}
        <div className="h-32 bg-card rounded-lg shadow-sm animate-pulse" />
        {/* 最近订单骨架 */}
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {lang === 'zh' ? '載入失敗' : 'Failed to load'}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <MemberInfoCard
        profile={profile}
        lang={lang}
        onSave={handleSaveProfile}
        saving={saving}
      />

      {/* 会员权益展示区 */}
      <div className="grid grid-cols-3 gap-3" data-ai-section-type="card-stat">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <div className="text-lg font-bold text-price font-mono">
              {lang === 'zh' ? '會員價' : 'Member Price'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'zh' ? '專享優惠價' : 'Exclusive pricing'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-600 font-mono">
              HK${monthlySavings.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'zh' ? '本月已節省' : 'Saved this month'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-2">
              <Gift className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-sm font-semibold text-foreground">
              {lang === 'zh' ? '生日禮包' : 'Birthday Gift'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasBirthdayBenefit
                ? lang === 'zh'
                  ? '專屬生日券'
                  : 'Birthday coupon'
                : lang === 'zh'
                  ? '升級解鎖'
                  : 'Upgrade to unlock'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 订单状态快捷入口 */}
      <Card className="border-0 shadow-sm" data-ai-section-type="card-menu">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {lang === 'zh' ? '我的訂單' : 'My Orders'}
            </h3>
            <Link
              to="/member/orders"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {lang === 'zh' ? '查看全部' : 'View All'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ORDER_STATUS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => navigate(`/member/orders?status=${tab.key}`)}
                  className="flex flex-col items-center gap-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-foreground">
                    {lang === 'zh' ? tab.labelZh : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <QuickEntryGrid lang={lang} onSelect={handleQuickEntry} />

      {/* 最近订单预览 */}
      <Card className="border-0 shadow-sm" data-ai-section-type="card-list">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {lang === 'zh' ? '最近訂單' : 'Recent Orders'}
            </h3>
            <Link
              to="/member/orders"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {lang === 'zh' ? '查看全部' : 'View All'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {lang === 'zh' ? '暫無訂單' : 'No orders yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/member/orders/${order.id}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {order.orderNo}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[order.orderStatus] || ''}`}
                    >
                      {STATUS_LABELS[order.orderStatus]
                        ? lang === 'zh'
                          ? STATUS_LABELS[order.orderStatus].zh
                          : STATUS_LABELS[order.orderStatus].en
                        : order.orderStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 flex-1">
                      {order.items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="w-12 h-12 rounded-md bg-muted overflow-hidden border-2 border-white flex-shrink-0"
                        >
                          {item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-full h-full p-2 text-muted-foreground/50" />
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border-2 border-white">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-price font-mono">
                        {formatPrice(order.payAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.items.length} {lang === 'zh' ? '件商品' : 'items'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
