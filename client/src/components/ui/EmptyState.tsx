import {
  ShoppingCart,
  Package,
  Heart,
  Ticket,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Button } from './button';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { Link } from 'react-router-dom';

export type EmptyStateType =
  | 'cart'
  | 'order'
  | 'favorite'
  | 'coupon'
  | 'search'
  | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  className?: string;
}

const EMPTY_CONFIG: Record<
  EmptyStateType,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    bgColor: string;
  }
> = {
  cart: {
    icon: ShoppingCart,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  order: {
    icon: Package,
    iconColor: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  favorite: {
    icon: Heart,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
  coupon: {
    icon: Ticket,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  search: {
    icon: Search,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  default: {
    icon: Package,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

const EMPTY_TEXTS: Record<
  EmptyStateType,
  { zh: { title: string; desc: string; action?: string }; en: { title: string; desc: string; action?: string } }
> = {
  cart: {
    zh: {
      title: '購物車是空的',
      desc: '快去選購心儀的商品吧',
      action: '去購物',
    },
    en: {
      title: 'Your cart is empty',
      desc: 'Start shopping to add items',
      action: 'Go Shopping',
    },
  },
  order: {
    zh: {
      title: '暫無訂單',
      desc: '趕快去選購喜愛的商品吧',
      action: '去逛逛',
    },
    en: {
      title: 'No orders yet',
      desc: 'Start shopping to place your first order',
      action: 'Browse Products',
    },
  },
  favorite: {
    zh: {
      title: '還沒有收藏商品',
      desc: '收藏喜歡的商品，方便下次購買',
      action: '去發現',
    },
    en: {
      title: 'No favorites yet',
      desc: 'Save items you love for later',
      action: 'Discover Products',
    },
  },
  coupon: {
    zh: {
      title: '暫無優惠券',
      desc: '關注活動，領取專屬優惠',
      action: '領取優惠券',
    },
    en: {
      title: 'No coupons available',
      desc: 'Stay tuned for exclusive offers',
      action: 'Get Coupons',
    },
  },
  search: {
    zh: {
      title: '找不到相關商品',
      desc: '試試其他關鍵詞或分類',
    },
    en: {
      title: 'No results found',
      desc: 'Try different keywords or categories',
    },
  },
  default: {
    zh: {
      title: '暫無資料',
      desc: '',
    },
    en: {
      title: 'Nothing here yet',
      desc: '',
    },
  },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { lang } = useLanguage();
  const config = EMPTY_CONFIG[type];
  const texts = EMPTY_TEXTS[type];
  const Icon = config.icon;

  const displayTitle = title ?? (lang === 'zh' ? texts.zh.title : texts.en.title);
  const displayDesc =
    description ?? (lang === 'zh' ? texts.zh.desc : texts.en.desc);
  const displayAction =
    actionLabel ?? (lang === 'zh' ? texts.zh.action : texts.en.action);

  const hasAction = displayAction && (actionPath || onAction);

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${config.bgColor}`}
      >
        <Icon className={`w-10 h-10 ${config.iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {displayTitle}
      </h3>
      {displayDesc && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {displayDesc}
        </p>
      )}
      {hasAction &&
        (actionPath ? (
          <Button asChild>
            <Link to={actionPath}>
              {displayAction}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button onClick={onAction}>
            {displayAction}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ))}
    </div>
  );
}

export default EmptyState;
