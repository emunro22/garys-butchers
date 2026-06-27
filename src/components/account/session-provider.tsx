'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
} | null;

type SessionCtx = {
  user: SessionUser;
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<SessionCtx>({ user: null, loading: true, refresh: () => {} });

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  function fetchSession() {
    fetch('/api/account/session')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, refresh: fetchSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCustomerSession() {
  return useContext(Ctx);
}
