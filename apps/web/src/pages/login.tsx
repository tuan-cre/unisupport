import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    const fieldErrors: Record<string, string> = {};
    if (!email) fieldErrors.email = t('auth.emailRequired') || t('auth.email');
    if (!password) fieldErrors.password = t('auth.passwordRequired') || t('auth.password');
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/tickets');
    } catch (err: any) {
      if (err.name === 'MfaRequiredError') {
        navigate('/mfa');
      } else {
        setGeneralError(err.response?.data?.message || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-background dark:from-background dark:via-background dark:to-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            UniSupport
          </p>
          <CardTitle className="text-2xl">{t('auth.signIn')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{generalError}</p>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('auth.email')}
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-400' : ''}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('auth.password')}
              </label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-red-400' : ''}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.signIn')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('common.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('auth.signUp')}
              </Link>
            </p>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
            </div>
          </div>

          <a
            href="/api/auth/saml/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.universitySSO')}
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
