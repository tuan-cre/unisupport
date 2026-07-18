import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../components/app-layout';
import {
  Shield,
  Users,
  Building2,
  BookOpen,
  Clock,
  BarChart3,
  AlertTriangle,
  Bug,
  GitCompare,
  Package,
  MessageCircle,
} from 'lucide-react';

const navItems = [
  { to: '/admin/users', label: 'page.adminUsers', icon: Users },
  { to: '/admin/roles', label: 'page.adminRoles', icon: Shield },
  { to: '/admin/departments', label: 'page.adminDepartments', icon: Building2 },
  { to: '/admin/kb', label: 'page.adminKb', icon: BookOpen },
  { to: '/admin/slas', label: 'page.adminSlas', icon: Clock },
  { to: '/admin/reports', label: 'page.adminReports', icon: BarChart3 },
  { to: '/admin/problems', label: 'page.adminProblems', icon: AlertTriangle },
  { to: '/admin/known-errors', label: 'page.adminKnownErrors', icon: Bug },
  { to: '/admin/changes', label: 'page.adminChanges', icon: GitCompare },
  { to: '/admin/assets', label: 'page.adminAssets', icon: Package },
  { to: '/admin/chat', label: 'page.adminChat', icon: MessageCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <div className="flex gap-8">
        <aside className="w-48 shrink-0">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`
                }
              >
                <item.icon className="h-4 w-4" />
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppLayout>
  );
}
