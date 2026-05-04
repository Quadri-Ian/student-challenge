import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getIdTokenResult } from 'firebase/auth';

interface RoleGuardProps {
  allow: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allow, children, fallback = null }: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoggedIn(false);
        setRole(null);
        setLoading(false);
        return;
      }
      setLoggedIn(true);
      try {
        const result = await getIdTokenResult(user, true);
        setRole((result.claims.role as string) || 'student');
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading…</div>;
  if (!loggedIn) return <Navigate to="/login" replace />;
  if (!role || !allow.includes(role)) {
    return fallback ? <>{fallback}</> : <div className="p-6">Not allowed.</div>;
  }
  return <>{children}</>;
}
