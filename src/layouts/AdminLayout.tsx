import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { CasidLogo } from '../components/CasidLogo';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
  end?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree, superAdminOnly: true },
  { label: 'CMS Pages', to: '/admin/pages', icon: FileText },
  { label: 'News & Updates', to: '/admin/news', icon: Newspaper },
  { label: 'Media Library', to: '/admin/media', icon: ImageIcon },
  { label: 'Enquiries', to: '/admin/enquiries', icon: Inbox },
  { label: 'Users & Roles', to: '/admin/users', icon: Users, superAdminOnly: true },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: Activity, superAdminOnly: true },
  { label: 'Backup & Settings', to: '/admin/settings', icon: Settings, superAdminOnly: true },
];

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({ enquiries: 0, approvals: 0 });

  useEffect(() => {
    if (!user) return;
    api
      .get('/admin/dashboard')
      .then((res) => {
        setPendingCounts({
          enquiries: res.data?.stats?.pendingEnquiries || 0,
          approvals: res.data?.stats?.pendingApprovals || 0,
        });
      })
      .catch(() => {});
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
        Verifying administrator session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const visibleNav = ADMIN_NAV.filter((item) => !item.superAdminOnly || user.role === 'super_admin');
  const currentTitle =
    visibleNav.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
      ?.label || 'Administration';
  const totalNotifs = pendingCounts.enquiries + pendingCounts.approvals;

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin" onClick={() => setSidebarOpen(false)}>
            <CasidLogo inverted />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800 text-xs text-slate-400">
          <span>Maintenance Portal</span>
          <span aria-hidden="true"> · </span>
          <span className="text-blue-300 font-medium">
            {user.role === 'super_admin' ? 'Super Admin' : 'Editor'}
          </span>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <span>Open Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-rose-300 hover:bg-slate-800 hover:text-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Open admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-slate-500 truncate">
              <span>Admin</span>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="font-semibold text-slate-900">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((p) => !p);
                  setProfileOpen(false);
                }}
                className="relative p-2 rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                aria-label="View maintenance notifications"
              >
                <Bell className="w-5 h-5" />
                {totalNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-800 text-white text-[10px] font-mono font-semibold flex items-center justify-center">
                    {totalNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-2 z-50">
                  <p className="text-xs font-semibold text-slate-900 px-2 pt-1">Action Queue</p>
                  <Link
                    to="/admin/enquiries"
                    onClick={() => setNotifOpen(false)}
                    className="block px-2 py-2 rounded hover:bg-slate-50 text-xs text-slate-700"
                  >
                    <span className="font-mono font-semibold text-blue-800">{pendingCounts.enquiries}</span> pending
                    contact enquiries awaiting review.
                  </Link>
                  <Link
                    to="/admin/products"
                    onClick={() => setNotifOpen(false)}
                    className="block px-2 py-2 rounded hover:bg-slate-50 text-xs text-slate-700"
                  >
                    <span className="font-mono font-semibold text-amber-700">{pendingCounts.approvals}</span> content
                    items submitted for approval.
                  </Link>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
              >
                <span className="font-medium text-slate-800 max-w-[140px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-xs font-medium text-blue-800 mt-1">
                      Role: {user.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 mt-1 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
