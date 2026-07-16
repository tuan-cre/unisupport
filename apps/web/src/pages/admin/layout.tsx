import { NavLink } from 'react-router-dom';
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
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: Shield },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/kb', label: 'Knowledge Base', icon: BookOpen },
  { to: '/admin/slas', label: 'SLA', icon: Clock },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/problems', label: 'Problems', icon: AlertTriangle },
  { to: '/admin/known-errors', label: 'Known Errors', icon: Bug },
  { to: '/admin/changes', label: 'Changes', icon: GitCompare },
  { to: '/admin/assets', label: 'Assets', icon: Package },
  { to: '/admin/chat', label: 'Live Chat', icon: MessageCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppLayout>
  );
}
