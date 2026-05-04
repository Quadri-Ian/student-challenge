import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function AfterLogin() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setLoading(false);
          navigate('/login', { replace: true });
          return;
        }
        const result = await getIdTokenResult(user, true);
        const role = result.claims.role || 'student';
        const emailVerified = !!result.claims.email_verified;
        const snap = await getDoc(doc(db, 'users', user.uid));
        const verificationComplete = !!((snap.data() || {}) as Record<string, unknown>).verificationComplete;

        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'judge') {
          navigate('/judge', { replace: true });
        } else if (emailVerified) {
          navigate(verificationComplete ? '/student/application' : '/student/verify', { replace: true });
        } else {
          navigate('/verify-email', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
      {loading ? 'Loading…' : null}
    </div>
  );
}
