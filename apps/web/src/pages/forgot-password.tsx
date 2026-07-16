import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      setResetLink(res.data.resetLink || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-blue-50 to-blue-100 p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            UniSupport
          </p>
          <CardTitle className="text-2xl">Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                If that email exists, a reset link has been sent.
              </p>
              {resetLink && (
                <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 break-all">
                  Dev mode — reset link:{' '}
                  <a href={resetLink} className="underline">
                    {resetLink}
                  </a>
                </p>
              )}
              <Link to="/login" className="block text-center text-sm text-blue-600 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>

              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
