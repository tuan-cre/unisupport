import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
    if (!firstName || firstName.length < 2) fieldErrors.firstName = t('common.atLeast2Chars');
    if (!lastName || lastName.length < 2) fieldErrors.lastName = t('common.atLeast2Chars');
    if (!email) fieldErrors.email = t('auth.emailIsRequired');
    if (!password || password.length < 8) fieldErrors.password = t('auth.atLeast8Chars');
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      await register(email, password, firstName, lastName);
      navigate('/tickets');
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else {
        setGeneralError(msg);
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
          <CardTitle className="text-2xl">{t('page.register')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{generalError}</p>
            )}

            <div>
              <label
                htmlFor="register-firstname"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('common.firstLabel')}
              </label>
              <Input
                id="register-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? 'border-red-400' : ''}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>

            <div>
              <label
                htmlFor="register-lastname"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('common.lastLabel')}
              </label>
              <Input
                id="register-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? 'border-red-400' : ''}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('auth.email')}
              </label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-400' : ''}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('auth.password')}
              </label>
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-red-400' : ''}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.registering') : t('auth.signUp')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('common.alreadyAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
