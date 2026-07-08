import { useState, useEffect, useCallback } from 'react';
import { getMemberProfile } from '@client/src/api/member';
import type { MemberProfile } from '@client/src/api/member';
import { logger } from '@lark-apaas/client-toolkit/logger';

/**
 * 会员等级类型
 */
export type MemberTier = 'normal' | 'silver' | 'gold' | 'diamond';

/**
 * 根据会员等级名称判断 tier
 */
export function getMemberTier(levelName?: string): MemberTier {
  if (!levelName) return 'normal';
  const name = levelName.toLowerCase();
  if (name.includes('diamond') || name.includes('鑽石') || name.includes('钻石')) {
    return 'diamond';
  }
  if (name.includes('gold') || name.includes('金')) {
    return 'gold';
  }
  if (name.includes('silver') || name.includes('銀') || name.includes('银')) {
    return 'silver';
  }
  return 'normal';
}

/**
 * 会员等级颜色配置
 */
export const MEMBER_TIER_CONFIG: Record<
  MemberTier,
  {
    badgeClass: string;
    gradient: string;
    labelZh: string;
    labelEn: string;
  }
> = {
  normal: {
    badgeClass: 'bg-gray-400 text-white',
    gradient: 'linear-gradient(135deg, hsl(220, 10%, 60%) 0%, hsl(220, 10%, 45%) 100%)',
    labelZh: '普通會員',
    labelEn: 'Normal',
  },
  silver: {
    badgeClass: 'bg-slate-300 text-slate-800',
    gradient: 'linear-gradient(135deg, hsl(220, 15%, 85%) 0%, hsl(220, 10%, 60%) 100%)',
    labelZh: '銀卡會員',
    labelEn: 'Silver',
  },
  gold: {
    badgeClass: 'bg-amber-400 text-amber-900',
    gradient: 'linear-gradient(135deg, hsl(45, 90%, 70%) 0%, hsl(38, 90%, 50%) 100%)',
    labelZh: '金卡會員',
    labelEn: 'Gold',
  },
  diamond: {
    badgeClass: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    gradient:
      'linear-gradient(135deg, hsl(230, 70%, 60%) 0%, hsl(260, 60%, 55%) 50%, hsl(280, 65%, 50%) 100%)',
    labelZh: '鑽石會員',
    labelEn: 'Diamond',
  },
};

interface UseMemberProfileResult {
  profile: MemberProfile | null;
  loading: boolean;
  error: string | null;
  tier: MemberTier;
  discountRate: number;
  refresh: () => Promise<void>;
}

/**
 * 获取当前会员信息的 Hook（带缓存）
 */
export function useMemberProfile(): UseMemberProfileResult {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMemberProfile();
      setProfile(data);
    } catch (err) {
      logger.error('useMemberProfile fetch failed', err);
      setError('Failed to load member profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const tier = getMemberTier(profile?.memberLevel?.nameZh || profile?.memberLevel?.nameEn);
  const discountRate = profile?.memberLevel?.discountRate
    ? Number(profile.memberLevel.discountRate)
    : 1;

  return {
    profile,
    loading,
    error,
    tier,
    discountRate,
    refresh: fetchProfile,
  };
}

export default useMemberProfile;
