import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Menu,
  X,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@client/src/hooks/use-mobile';
import { useLanguage } from '@client/src/hooks/useLanguage';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const navItems = [
    { path: '/admin/dashboard', labelKey: 'admin.dashboard' as const, icon: LayoutDashboard },
    { path: '/admin/products', labelKey: 'admin.productManagement' as const, icon: Package },
    { path: '/admin/orders', labelKey: 'admin.orderManagement' as const, icon: ShoppingCart },
    { path: '/admin/marketing', labelKey: 'admin.marketingManagement' as const, icon: Tag },
  ];

  const isCollapsed = !sidebarOpen;

  const SidebarContent = (
    <nav className="flex-1 py-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const SidebarFooter = (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{t('admin.admin')}</p>
            <p className="text-xs text-muted-foreground truncate">admin@hklifestore.hk</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-300 bg-card border-r border-border overflow-hidden ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-3 border-b border-border shrink-0">
          {!isCollapsed && (
            <span className="font-bold text-primary px-1">
              <span className="text-accent">HK</span> 後台管理
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-muted transition-colors mx-auto"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-foreground" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
        {SidebarContent}
        {SidebarFooter}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && isMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-card border-r border-border flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
              <span className="font-bold text-primary">
                <span className="text-accent">HK</span> 後台管理
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            {SidebarContent}
            {SidebarFooter}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">{t('admin.adminPanel')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.logout')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
