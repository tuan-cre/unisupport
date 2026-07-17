import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.atLeast8Chars'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-background dark:from-background dark:via-background dark:to-background p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <p className="text-6xl font-bold text-muted-foreground">400</p>
            <CardTitle className="text-xl">{t('auth.invalidResetLink')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">{t('auth.resetLinkMissing')}</p>
            <Link to="/forgot-password">
              <Button>{t('auth.requestNewLink')}</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-background dark:from-background dark:via-background dark:to-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            UniSupport
          </p>
          <CardTitle className="text-2xl">
            {done ? t('auth.passwordReset') : t('auth.chooseNewPassword')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('auth.passwordHasBeenReset')}</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                {t('auth.signIn')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('auth.newPassword')}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('auth.confirmPassword')}
                </label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.resetting') : t('auth.resetPassword')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
