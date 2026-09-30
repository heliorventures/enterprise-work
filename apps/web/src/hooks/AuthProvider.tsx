import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../hooks/useAuth';
import api, { setAccessToken, setRefreshToken, unwrap, getRefreshToken } from '../api/client';
import { User } from '../types/models';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (!localStorage.getItem('accessToken') && !getRefreshToken()) {
        setUser(null);
        return;
      }
      const res = await api.get('/auth/me');
      setUser(unwrap<User>(res.data));
    } catch {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const failSafe = window.setTimeout(() => {
      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
    }, 8000);
    load().finally(() => {
      window.clearTimeout(failSafe);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
    };
  }, [load]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const data = unwrap<{ accessToken: string; refreshToken: string; user: User }>(res.data);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: getRefreshToken() });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      has: (p: string) => !!user?.permissions.includes(p),
      hasRole: (...roles: string[]) => !!user && roles.includes(user.role.name),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
