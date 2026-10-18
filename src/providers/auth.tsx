import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api, setApiToken, setUnauthorizedHandler } from '@/lib/api';
import { registerForPush, unregisterPush } from '@/lib/push';
import { readToken, writeToken } from '@/lib/storage';
import type { Feature, Me } from '@/lib/types';

/**
 * Session du parent : jeton (trousseau du téléphone) + profil (/auth/me).
 * Le parent se connecte uniquement avec le code d'accès remis par l'école.
 */
interface AuthState {
  ready: boolean;
  user: Me | null;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: Me) => void;
  /** Module inclus dans le plan de l'école (notes, absences, finances…). */
  hasFeature: (feature: Feature) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Me | null>(null);

  const clear = useCallback(async () => {
    setApiToken(null);
    await writeToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Reprise de la session au démarrage
  useEffect(() => {
    (async () => {
      const saved = await readToken();
      if (saved) {
        setApiToken(saved);
        try {
          setUser(await api.me());
        } catch (e) {
          // Hors connexion : on garde le jeton et on réessaiera ; jeton révoqué : on l'efface
          if ((e as { status?: number }).status === 401) await clear();
        }
      }
      setReady(true);
    })();
  }, [clear]);

  useEffect(() => setUnauthorizedHandler(() => void clear()), [clear]);

  // Connecté : ce téléphone reçoit les notifications push (autorisation demandée la première fois)
  const userId = user?.id;
  useEffect(() => {
    if (userId) void registerForPush();
  }, [userId]);

  const login = useCallback(async (code: string) => {
    const device = Platform.select({ ios: 'iPhone', android: 'Android', default: 'Navigateur' });
    const out = await api.login(code, `Application Ardoise (${device})`);
    setApiToken(out.token);
    await writeToken(out.token);
    setUser(out.data);
  }, []);

  const logout = useCallback(async () => {
    await unregisterPush();
    try {
      await api.logout();
    } catch {
      /* jeton déjà révoqué */
    }
    await clear();
  }, [clear]);

  const refresh = useCallback(async () => setUser(await api.me()), []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      login,
      logout,
      refresh,
      setUser,
      hasFeature: (feature) => !!user?.features?.includes(feature),
    }),
    [ready, user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
