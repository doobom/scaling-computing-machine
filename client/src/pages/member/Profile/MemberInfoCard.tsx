import { useState } from 'react';
import {
  User,
  Settings,
  Loader2,
  Percent,
  Truck,
  Headphones,
  Gift,
  Crown,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Progress } from '@client/src/components/ui/progress';
import { Badge } from '@client/src/components/ui/badge';
import { Card } from '@client/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import type { MemberProfile } from '@client/src/api/member';
import {
  getMemberTier,
  MEMBER_TIER_CONFIG,
} from '@client/src/hooks/useMemberProfile';

interface MemberInfoCardProps {
  profile: MemberProfile;
  lang: 'zh' | 'en';
  onSave: (data: { nickname?: string; phone?: string; email?: string }) => Promise<void>;
  saving: boolean;
}

const BENEFIT_ICONS = {
  discount: Percent,
  shipping: Truck,
  service: Headphones,
  birthday: Gift,
};

const MemberInfoCard = ({ profile, lang, onSave, saving }: MemberInfoCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: profile.nickname || '',
    phone: profile.phone || '',
    email: profile.email || '',
  });

  const tier = getMemberTier(
    profile.memberLevel?.nameZh || profile.memberLevel?.nameEn,
  );
  const tierConfig = MEMBER_TIER_CONFIG[tier];

  const levelName =
    lang === 'zh'
      ? profile.memberLevel?.nameZh || tierConfig.labelZh
      : profile.memberLevel?.nameEn || tierConfig.labelEn;

  const nextLevelName =
    lang === 'zh' ? profile.nextLevel?.nameZh : profile.nextLevel?.nameEn;

  const discountRate = profile.memberLevel?.discountRate
    ? Number(profile.memberLevel.discountRate)
    : 1;
  const discountPercent = Math.round((1 - discountRate) * 100);

  // 权益列表（根据等级动态展示）
  const benefits = [
    {
      key: 'discount',
      icon: BENEFIT_ICONS.discount,
      labelZh: discountPercent > 0 ? `${discountPercent}% 折扣` : '會員價',
      labelEn: discountPercent > 0 ? `${discountPercent}% Off` : 'Member Price',
    },
    {
      key: 'shipping',
      icon: BENEFIT_ICONS.shipping,
      labelZh: tier !== 'normal' ? '免運費' : '滿$299免運',
      labelEn: tier !== 'normal' ? 'Free Shipping' : 'Free over $299',
    },
    {
      key: 'service',
      icon: BENEFIT_ICONS.service,
      labelZh: '專屬客服',
      labelEn: 'VIP Support',
    },
    {
      key: 'birthday',
      icon: BENEFIT_ICONS.birthday,
      labelZh: '生日禮券',
      labelEn: 'Birthday Coupon',
    },
  ];

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const handleSave = async () => {
    await onSave(editForm);
    setEditOpen(false);
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div
        className="relative p-6 text-white"
        style={{ background: tierConfig.gradient }}
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden border-2 border-white/30">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold truncate">
                {profile.nickname || (lang === 'zh' ? '會員' : 'Member')}
              </h2>
              <Badge
                className={`text-xs border-0 ${tierConfig.badgeClass}`}
              >
                <Crown className="w-3 h-3 mr-1" />
                {levelName}
              </Badge>
            </div>
            <p className="text-sm text-white/70 mt-1">
              {lang === 'zh' ? '累計消費' : 'Total Spent'}：
              <span className="font-mono font-semibold text-white ml-1">
                {formatPrice(profile.totalConsumption)}
              </span>
            </p>
            {profile.nextLevel && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/70 mb-1.5">
                  <span>
                    {lang === 'zh'
                      ? `距離 ${nextLevelName} 還需`
                      : `Next: ${nextLevelName}`}
                  </span>
                  <span className="font-mono">{profile.upgradeProgress}%</span>
                </div>
                <Progress
                  value={profile.upgradeProgress}
                  className="h-1.5 bg-white/20 [&>div]:bg-white"
                />
              </div>
            )}
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {lang === 'zh' ? '編輯個人資料' : 'Edit Profile'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '暱稱' : 'Nickname'}</Label>
                  <Input
                    value={editForm.nickname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nickname: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '手機號' : 'Phone'}</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '電郵' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {lang === 'zh' ? '保存' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 权益图标列表 */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/20">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.key}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-white/90 text-center leading-tight">
                  {lang === 'zh' ? benefit.labelZh : benefit.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default MemberInfoCard;
