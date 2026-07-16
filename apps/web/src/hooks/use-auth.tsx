import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
  totpEnabled?: boolean;
  role?: { id: string; name: string; permissions: { name: string }[] };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mfaRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const storeTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data.data;
    if (data.mfaRequired) {
      setMfaToken(data.mfaToken);
      throw new MfaRequiredError();
    }
    storeTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  class MfaRequiredError extends Error {
    constructor() {
      super('MFA required');
      this.name = 'MfaRequiredError';
    }
  }

  const verifyMfa = async (code: string) => {
    const res = await api.post('/auth/mfa', { mfaToken, code });
    const data = res.data.data;
    storeTokens(data.accessToken, data.refreshToken);
    setMfaToken(null);
    setUser(data.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const res = await api.post('/auth/register', { email, password, firstName, lastName });
    const { user: u, accessToken, refreshToken } = res.data.data;
    storeTokens(accessToken, refreshToken);
    setUser(u);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignore */
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mfaRequired: !!mfaToken,
        login,
        verifyMfa,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
