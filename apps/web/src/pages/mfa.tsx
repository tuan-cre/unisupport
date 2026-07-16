import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield } from 'lucide-react';

export default function MfaPage() {
  const { verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyMfa(code);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">Two-Factor Authentication</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the code from your authenticator app</p>
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

        <Button type="submit" className="w-full" disabled={code.length < 6}>
          Verify
        </Button>
      </form>
    </div>
  );
}
