import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield } from 'lucide-react';

export default function MfaPage() {
  const { t } = useTranslation();
  const { verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyMfa(code);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-blue-600" />
          <h1 className="text-xl font-semibold text-foreground">{t('auth.mfaTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('auth.mfaDesc')}</p>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          className="mb-4 text-center text-lg tracking-widest"
          maxLength={6}
          required
        />

        <Button type="submit" className="w-full" disabled={code.length < 6 || loading}>
          {loading ? t('common.verifyingTitle') : t('auth.verify')}
        </Button>
      </form>
    </div>
  );
}
