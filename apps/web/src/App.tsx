import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/use-auth';
import { ToastProvider } from './hooks/use-toast';
import { NotificationsProvider } from './hooks/use-notifications';
import ProtectedRoute from './components/protected-route';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import TicketListPage from './pages/ticket-list';
import TicketDetailPage from './pages/ticket-detail';
import CreateTicketPage from './pages/ticket-create';
import NotFoundPage from './pages/not-found';
import ForbiddenPage from './pages/forbidden';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import ChangePasswordPage from './pages/change-password';
import MfaPage from './pages/mfa';
import SamlCallbackPage from './pages/saml-callback';
import AdminUsersPage from './pages/admin/users';
import AdminRolesPage from './pages/admin/roles';
import AdminDepartmentsPage from './pages/admin/departments';
import AdminKbPage from './pages/admin/kb';
import AdminSlasPage from './pages/admin/slas';
import AdminReportsPage from './pages/admin/reports';
import AdminProblemsPage from './pages/admin/problems';
import AdminKnownErrorsPage from './pages/admin/known-errors';
import AdminChangesPage from './pages/admin/changes';
import AdminAssetsPage from './pages/admin/assets';
import AdminChatPage from './pages/admin/chat';
import KbListPage from './pages/kb-list';
import KbArticlePage from './pages/kb-article';
import DashboardPage from './pages/dashboard';
import ProfilePage from './pages/profile';
import ChatWidget from './components/chat-widget';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ToastProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/mfa" element={<MfaPage />} />
                <Route path="/auth/saml/callback" element={<SamlCallbackPage />} />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePasswordPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/403" element={<ForbiddenPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <TicketListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets/new"
                  element={
                    <ProtectedRoute>
                      <CreateTicketPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets/:id"
                  element={
                    <ProtectedRoute>
                      <TicketDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/roles"
                  element={
                    <ProtectedRoute>
                      <AdminRolesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/departments"
                  element={
                    <ProtectedRoute>
                      <AdminDepartmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/kb"
                  element={
                    <ProtectedRoute>
                      <AdminKbPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/slas"
                  element={
                    <ProtectedRoute>
                      <AdminSlasPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/problems"
                  element={
                    <ProtectedRoute>
                      <AdminProblemsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/known-errors"
                  element={
                    <ProtectedRoute>
                      <AdminKnownErrorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/changes"
                  element={
                    <ProtectedRoute>
                      <AdminChangesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/assets"
                  element={
                    <ProtectedRoute>
                      <AdminAssetsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/chat"
                  element={
                    <ProtectedRoute>
                      <AdminChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kb"
                  element={
                    <ProtectedRoute>
                      <KbListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kb/:slug"
                  element={
                    <ProtectedRoute>
                      <KbArticlePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <ChatWidget />
            </ToastProvider>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
