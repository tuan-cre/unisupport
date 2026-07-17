import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import AppLayout from '../components/app-layout';

export default function ChangePasswordPage() {
  const { t } = useTranslation(['common', 'auth', 'page']);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.atLeast8Chars'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast({ title: t('auth.passwordChanged'), variant: 'success' });
      navigate('/tickets');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{t('page.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('auth.currentPassword')}
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('auth.newPasswordLabel')}
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('auth.confirmNewPassword')}
              </label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.changing') : t('common.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
