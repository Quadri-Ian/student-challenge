import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

const MAX_JUDGES = 10;

interface Judge {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminJudges() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'judge'));
    const unsub = onSnapshot(q, (snap) => {
      setJudges(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Judge, 'uid'>) })));
    });
    return () => unsub();
  }, []);

  async function invite() {
    if (judges.length >= MAX_JUDGES) { setMessage(`Maximum of ${MAX_JUDGES} judges allowed.`); return; }
    try {
      setWorking(true); setMessage(null);
      const fn = httpsCallable(functions, 'inviteUser');
      await fn({ email: inviteEmail.trim(), role: 'judge' });
      setMessage(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to invite.');
    } finally {
      setWorking(false);
    }
  }

  async function promote() {
    if (judges.length >= MAX_JUDGES) { setMessage(`Maximum of ${MAX_JUDGES} judges allowed.`); return; }
    try {
      setWorking(true); setMessage(null);
      const fn = httpsCallable(functions, 'setUserRole');
      await fn({ email: promoteEmail.trim(), role: 'judge' });
      setMessage(`${promoteEmail.trim()} promoted to judge.`);
      setPromoteEmail('');
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to promote.');
    } finally {
      setWorking(false);
    }
  }

  async function removeJudge(uid: string) {
    try {
      setWorking(true); setMessage(null);
      const fn = httpsCallable(functions, 'deleteUserDeep');
      await fn({ uid });
      setMessage('Judge removed.');
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to remove.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Judges ({judges.length}/{MAX_JUDGES})</h1>
      {message && <div className="mb-4 text-sm rounded-md bg-blue-50 text-blue-800 px-3 py-2">{message}</div>}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <h2 className="font-medium">Invite New Judge</h2>
          <input type="email" placeholder="Email address" className="w-full border rounded-lg px-3 py-2 text-sm"
            value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <button onClick={invite} disabled={working || !inviteEmail.trim()}
            className="w-full py-2 rounded-lg bg-blue-700 text-white text-sm font-medium disabled:opacity-70">
            {working ? 'Working…' : 'Send Invite'}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <h2 className="font-medium">Promote Existing User</h2>
          <input type="email" placeholder="Existing user email" className="w-full border rounded-lg px-3 py-2 text-sm"
            value={promoteEmail} onChange={(e) => setPromoteEmail(e.target.value)} />
          <button onClick={promote} disabled={working || !promoteEmail.trim()}
            className="w-full py-2 rounded-lg bg-green-700 text-white text-sm font-medium disabled:opacity-70">
            {working ? 'Working…' : 'Promote to Judge'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {judges.map((j) => (
              <tr key={j.uid} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{j.firstName} {j.lastName}</td>
                <td className="px-4 py-3">{j.email}</td>
                <td className="px-4 py-3">
                  <button onClick={() => removeJudge(j.uid)} disabled={working}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-70">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {judges.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No judges yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
