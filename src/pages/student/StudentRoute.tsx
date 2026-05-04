import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

// StudentRoute — redirects to verify or submit based on verification status
export default function StudentRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');
      if (!user.emailVerified) return navigate('/verify-email');
      const snap = await getDoc(doc(db, 'users', user.uid));
      const verified = snap.exists() && !!(snap.data() as Record<string, unknown>).verificationComplete;
      navigate(verified ? '/student/submit' : '/student/verify', { replace: true });
    })();
  }, [navigate]);

  return null;
}
