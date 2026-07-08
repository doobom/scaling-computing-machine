import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Globe,
  ChevronDown,
  Baby,
  Sparkles,
  UtensilsCrossed,
  Home,
  Shirt,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { useCart } from '@client/src/hooks/useCart';
import { useIsMobile } from '@client/src/hooks/use-mobile';
import MobileTabBar from '@client/src/components/MobileTabBar';
import { logger } from '@lark-apaas/client-toolkit/logger';

const categories = [
  { key: 'baby', icon: Baby, path: '/products?category=baby' },
  { key: 'cosmetics', icon: Sparkles, path: '/products?category=cosmetics' },
  { key: 'food', icon: UtensilsCrossed, path: '/products?category=food' },
  { key: 'home', icon: Home, path: '/products?category=home' },
  { key: 'apparel', icon: Shirt, path: '/products?category=apparel' },
];

const StoreLayout = () => {
  const { lang, toggleLang, t } = useLanguage();
  const { itemCount } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', labelKey: 'nav.home' as const },
    { path: '/products', labelKey: 'nav.products' as const },
    { path: '/cart', labelKey: 'nav.cart' as const },
    { path: '/member/profile', labelKey: 'nav.member' as const },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    logger.info(`search: ${searchQuery}`);
    navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
              <span className="text-accent">HK</span>
              <span className="hidden sm:inline">生活百貨</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.slice(0, 2).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-accent ${
                      isActive ? 'text-accent' : 'text-primary-foreground/90'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}

              {/* Category Dropdown */}
              <div className="relative" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors"
                >
                  {t('nav.categories')}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {categoryOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-card text-foreground rounded-lg shadow-lg border border-border overflow-hidden">
                    <div className="py-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <Link
                            key={cat.key}
                            to={cat.path}
                            onClick={() => setCategoryOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          >
                            <Icon className="w-4 h-4 text-accent" />
                            {t(`categories.${cat.key}` as Parameters<typeof t>[0])}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search - desktop */}
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center bg-white/10 rounded-full px-3 py-1.5 focus-within:bg-white/20 transition-colors"
              >
                <Search className="w-4 h-4 text-white/70 shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 w-40 ml-2"
                />
              </form>

              {/* Mobile search icon */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:text-accent transition-colors"
                aria-label={t('search.button')}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1 text-sm hover:text-accent transition-colors px-2"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'zh' ? 'EN' : '繁'}</span>
              </button>

              {/* Cart */}
              <NavLink
                to="/cart"
                className="relative p-2 hover:text-accent transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </NavLink>

              {/* Member */}
              <NavLink
                to="/member/profile"
                className="p-2 hover:text-accent transition-colors hidden sm:block"
              >
                <User className="w-5 h-5" />
              </NavLink>

              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="md:hidden pb-3">
              <div className="flex items-center bg-white/10 rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-white/70 shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  autoFocus
                  className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 w-full ml-2"
                />
              </div>
            </form>
          )}

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden pb-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-medium py-2.5 px-2 rounded-md transition-colors ${
                      isActive
                        ? 'text-accent bg-white/5'
                        : 'text-primary-foreground/90 hover:bg-white/5'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCategoryDrawerOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm font-medium py-2.5 px-2 rounded-md text-primary-foreground/90 hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                {t('nav.categories')}
                <ChevronDown className="w-4 h-4" />
              </button>
              <NavLink
                to="/member/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2.5 px-2 rounded-md text-primary-foreground/90 hover:bg-white/5 transition-colors sm:hidden flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {t('nav.member')}
              </NavLink>
            </nav>
          )}
        </div>
      </header>

      {/* Category Drawer (mobile) */}
      {categoryDrawerOpen && isMobile && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCategoryDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-card text-foreground h-full shadow-xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{t('nav.categories')}</h3>
              <button
                type="button"
                onClick={() => setCategoryDrawerOpen(false)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.key}
                    to={cat.path}
                    onClick={() => setCategoryDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    <Icon className="w-5 h-5 text-accent" />
                    {t(`categories.${cat.key}` as Parameters<typeof t>[0])}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:pb-0 pb-[60px]">
        <Outlet />
      </main>

      <footer className="bg-primary text-primary-foreground/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-3">{t('footer.aboutUs')}</h4>
              <p className="text-sm text-white/60">{t('footer.aboutDesc')}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">
                {t('footer.customerService')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-accent cursor-pointer transition-colors">
                  {t('footer.faq')}
                </li>
                <li className="hover:text-accent cursor-pointer transition-colors">
                  {t('footer.contactUs')}
                </li>
                <li className="hover:text-accent cursor-pointer transition-colors">
                  {t('footer.shippingInfo')}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">
                {t('footer.shoppingGuide')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-accent cursor-pointer transition-colors">
                  {t('footer.paymentMethods')}
                </li>
                <li className="hover:text-accent cursor-pointer transition-colors">
                  {t('footer.returnPolicy')}
                </li>
                <li className="hover:text-accent cursor-pointer transition-colors">
                  {t('footer.membershipTerms')}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">{t('footer.contact')}</h4>
              <ul className="space-y-2 text-sm">
                <li>WhatsApp: +852 9999 9999</li>
                <li>Email: info@hklifestore.hk</li>
                <li>{t('footer.hours')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/50">
            © 2026 HK Life Store. {t('footer.copyright')}
          </div>
        </div>
      </footer>

      {/* 移动端底部导航 */}
      <MobileTabBar />
    </div>
  );
};

export default StoreLayout;
