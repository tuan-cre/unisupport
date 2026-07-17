import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type User } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import AppLayout from '../components/app-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import api from '../lib/api';

export default function ProfilePage() {
  const { t } = useTranslation(['common', 'auth', 'page']);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [saving, setSaving] = useState(false);
  const [mfaDialog, setMfaDialog] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQr, setMfaQr] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me', { firstName, lastName });
      await refreshUser();
      toast({ title: t('common.success') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">{t('page.profile')}</h2>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('auth.email')}</label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('common.firstLabel')}</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('common.lastLabel')}</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t('common.saving') : t('common.saveChanges')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/tickets')}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('page.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('common.statusLabel')}:{' '}
              <span className="font-medium text-slate-900">{user?.status}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('common.roleLabel')}:{' '}
              <span className="font-medium text-slate-900">{user?.role?.name ?? 'None'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('auth.emailVerified')}:{' '}
              {user?.emailVerifiedAt ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  {t('common.verified')}
                </Badge>
              ) : (
                <Badge variant="secondary">{t('common.pending')}</Badge>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('common.twoFactorAuth')}:{' '}
              {user?.totpEnabled ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  {t('common.enabled')}
                </Badge>
              ) : (
                <Badge variant="secondary">{t('common.disabled')}</Badge>
              )}
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => navigate('/change-password')}>
                {t('page.changePassword')}
              </Button>
              {user?.totpEnabled ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await api.post('/auth/mfa/disable');
                    refreshUser();
                    toast({ title: t('auth.mfaDisabled') });
                  }}
                >
                  {t('auth.disable2fa')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const res = await api.post('/auth/mfa/enable');
                    setMfaSecret(res.data.data.secret);
                    setMfaQr(res.data.data.qrCode);
                    setMfaCode('');
                    setMfaDialog(true);
                  }}
                >
                  {t('auth.enable2fa')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={mfaDialog}
        onOpenChange={(v) => {
          if (!v) setMfaDialog(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('auth.setUpTwoFactor')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-center">
            {mfaQr && <img src={mfaQr} alt="QR Code" className="mx-auto h-48 w-48" />}
            <p className="text-xs text-slate-500">
              {t('auth.orEnterManually')}{' '}
              <code className="rounded bg-slate-100 px-1">{mfaSecret}</code>
            </p>
            <Input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder={t('auth.enterCode')}
              className="text-center tracking-widest"
              maxLength={6}
            />
            <Button
              className="w-full"
              disabled={mfaCode.length < 6 || verifying}
              onClick={async () => {
                setVerifying(true);
                try {
                  await api.post('/auth/mfa/verify-setup', { code: mfaCode });
                  await refreshUser();
                  toast({ title: t('auth.mfaEnabledSuccess') });
                  setMfaDialog(false);
                } catch (err: any) {
                  toast({
                    title: err.response?.data?.message || t('auth.invalidCode'),
                    variant: 'destructive',
                  });
                } finally {
                  setVerifying(false);
                }
              }}
            >
              {verifying ? t('common.verifying') : t('auth.verifyEnable')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('auth.privacyData')}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const r = await api.get('/auth/me/export');
              const blob = new Blob([JSON.stringify(r.data.data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'my-data.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            {t('auth.exportMyData')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (!window.confirm(t('auth.anonymizeConfirm'))) return;
              await api.delete('/auth/me/anonymize');
              window.location.href = '/login';
            }}
          >
            {t('auth.anonymizeAccount')}
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
