'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  function fetchSession() {
    fetch('/api/account/session')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }

  // Re-check the session on every navigation, since logging in/out on one
  // page doesn't remount this provider — without this the header would
  // keep showing whatever was true when the app first loaded.
  useEffect(() => {
    fetchSession();
  }, [pathname]);

  return (
    <Ctx.Provider value={{ user, loading, refresh: fetchSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCustomerSession() {
  return useContext(Ctx);
}
