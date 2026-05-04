import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../firebase';
import StudentLayout from '../../layouts/StudentLayout';

type TabKey = 'general' | 'account';

export default function StudentSettings() {
  const [tab, setTab] = useState<TabKey>('general');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const prefs = snap.data()?.preferences;
        if (typeof prefs?.emailNotifications === 'boolean') {
          setEmailNotifications(prefs.emailNotifications);
        }
      }
    })();
  }, []);

  async function saveGeneral() {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'users', user.uid), { preferences: { emailNotifications } }, { merge: true });
      setMessage('Preferences saved.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    const user = auth.currentUser;
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
    setMessage(`Password reset email sent to ${user.email}`);
  }

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-xl">
        <div className="flex gap-4 border-b mb-6">
          {(['general', 'account'] as TabKey[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium ${tab === t ? 'border-b-2 border-blue-700 text-blue-700' : 'text-gray-500'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
        {tab === 'general' && (
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)} />
              <span className="text-sm">Email Notifications</span>
            </label>
            <button onClick={saveGeneral} disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium disabled:opacity-70">
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        )}
        {tab === 'account' && (
          <div className="space-y-4">
            <div className="text-sm">
              <span className="font-medium">Email:</span> {auth.currentUser?.email}
            </div>
            <button onClick={changePassword} className="px-4 py-2 rounded-lg border text-sm font-medium">
              Change Password
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
