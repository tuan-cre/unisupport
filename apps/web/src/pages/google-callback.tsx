import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No token provided');
      return;
    }

    api
      .post('/auth/google/exchange', { token })
      .then((res) => {
        const data = res.data.data;
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        navigate('/tickets');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Google login failed');
      });
  }, [token, navigate]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-background dark:from-background dark:via-background dark:to-background p-8">
        <div className="w-full max-w-sm text-center">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-background dark:from-background dark:via-background dark:to-background p-8">
      <div className="w-full max-w-sm text-center">
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </main>
  );
}
