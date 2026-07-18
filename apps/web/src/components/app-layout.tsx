import ConfirmDialog from './confirm-dialog';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import { useNotifications } from '../hooks/use-notifications';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  User,
  LogOut,
  KeyRound,
  Plus,
  Bell,
  Shield,
  BookOpen,
  Sun,
  Moon,
  LayoutDashboard,
  Ticket,
} from 'lucide-react';
import { LangSwitch } from './lang-switch';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('unisupport-theme') as 'light' | 'dark' | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('unisupport-theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/tickets')}
            className="text-lg font-bold text-foreground hover:text-blue-600 transition-colors"
          >
            UniSupport
          </button>

          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex"
            >
              <LayoutDashboard className="mr-1 h-4 w-4" />
              {t('nav.dashboard')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tickets')}
              className="hidden sm:inline-flex"
            >
              <Ticket className="mr-1 h-4 w-4" />
              {t('page.tickets')}
            </Button>
            <LangSwitch />
            <button
              onClick={() => setTheme((p) => (p === 'light' ? 'dark' : 'light'))}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors hidden sm:block"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/kb')}
              className="hidden sm:inline-flex"
            >
              <BookOpen className="mr-1 h-4 w-4" />
              {t('page.knowledgeBase')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/tickets/new')}>
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">
                {t('common.create')} {t('page.tickets').toLowerCase()}
              </span>
            </Button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-background shadow-lg">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">
                      {t('common.notifications')}
                    </span>
                    {unread > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {t('common.markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {t('common.noNotificationsYet')}
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (!n.readAt) markRead(n.id);
                            if (n.link) navigate(n.link);
                            setNotifOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left transition-colors hover:bg-accent ${
                            !n.readAt ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</div>
                <DropdownMenuSeparator />
                {user?.role?.permissions?.some((p) => p.name === 'user:manage') && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                      <Shield className="mr-2 h-4 w-4" />
                      {t('common.adminPanel')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('common.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/change-password')}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t('page.changePassword')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
        title={t('common.logoutConfirm')}
        description={t('common.logoutDesc')}
        confirmLabel={t('nav.logout')}
      />

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
