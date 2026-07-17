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
  { to: '/admin/users', label: 'adminUsers', icon: Users },
  { to: '/admin/roles', label: 'adminRoles', icon: Shield },
  { to: '/admin/departments', label: 'adminDepartments', icon: Building2 },
  { to: '/admin/kb', label: 'adminKb', icon: BookOpen },
  { to: '/admin/slas', label: 'adminSlas', icon: Clock },
  { to: '/admin/reports', label: 'adminReports', icon: BarChart3 },
  { to: '/admin/problems', label: 'adminProblems', icon: AlertTriangle },
  { to: '/admin/known-errors', label: 'adminKnownErrors', icon: Bug },
  { to: '/admin/changes', label: 'adminChanges', icon: GitCompare },
  { to: '/admin/assets', label: 'adminAssets', icon: Package },
  { to: '/admin/chat', label: 'adminChat', icon: MessageCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('page');

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
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                }
              >
                <item.icon className="h-4 w-4" />
                {t(`page.${item.label}`)}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppLayout>
  );
}
