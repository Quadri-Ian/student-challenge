import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdTokenResult } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';

export default function SetupAdmin() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');
      setEmail(user.email ?? null);
      const result = await getIdTokenResult(user, true);
      setRole((result.claims.role as string) ?? null);
    })();
  }, [navigate]);

  const makeAdmin = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setWorking(true);
      setMessage(null);
      const bootstrapAdmin = httpsCallable(functions, 'bootstrapAdmin');
      await bootstrapAdmin({});
      await user.getIdToken(true);
      const result = await getIdTokenResult(user, true);
      setRole((result.claims.role as string) ?? null);
      setMessage("You are now an admin. If the menu doesn't change, reload the page.");
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to bootstrap admin.');
    } finally {
      setWorking(false);
    }
  };

  const signOut = async () => {
    await auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Setup Admin</h1>
        <div className="text-sm text-gray-600">
          <div><span className="font-medium">Signed in as:</span> {email || '—'}</div>
          <div><span className="font-medium">Current role:</span> {role || 'none'}</div>
        </div>
        {message && (
          <div className="rounded-md bg-green-50 text-green-800 text-sm px-3 py-2">{message}</div>
        )}
        <button
          onClick={makeAdmin}
          disabled={working}
          className="w-full py-3 rounded-full bg-purple-900 text-white font-semibold disabled:opacity-70"
        >
          {working ? 'Working…' : 'Make me admin'}
        </button>
        <button onClick={signOut} className="w-full py-3 rounded-full border font-semibold">
          Sign out
        </button>
        <p className="text-xs text-gray-500">
          Note: The server checks your email against the allowed bootstrap email.
        </p>
      </div>
    </div>
  );
}
