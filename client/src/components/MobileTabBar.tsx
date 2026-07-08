import { NavLink } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { useCart } from '@client/src/hooks/useCart';

interface TabItem {
  path: string;
  labelKey: 'nav.home' | 'nav.products' | 'nav.cart' | 'nav.member';
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const TABS: TabItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home, end: true },
  { path: '/products', labelKey: 'nav.products', icon: Grid3X3 },
  { path: '/cart', labelKey: 'nav.cart', icon: ShoppingCart },
  { path: '/member/profile', labelKey: 'nav.member', icon: User },
];

const MobileTabBar = () => {
  const { t } = useLanguage();
  const { itemCount } = useCart();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-full">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isCart = tab.path === '/cart';
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-price text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {t(tab.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
