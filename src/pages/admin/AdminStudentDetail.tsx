import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  educationLevel?: string;
  school?: string;
  level?: string;
  city?: string;
  lga?: string;
  address?: string;
  dob?: string;
  phone?: string;
  verificationComplete?: boolean;
  verificationFiles?: {
    passport: { url: string } | null;
    idcard: { url: string } | null;
  };
}

export default function AdminStudentDetail() {
  const { uid } = useParams<{ uid: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as UserData;
      setUserData(d);
      setDisplayName(`${d.firstName ?? ''} ${d.lastName ?? ''}`.trim());
    });
  }, [uid]);

  async function saveProfile() {
    if (!uid) return;
    try {
      setWorking(true); setMessage(null);
      const fn = httpsCallable(functions, 'adminUpdateUserProfile');
      await fn({ uid, displayName });
      setMessage('Profile updated.');
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to update profile.');
    } finally {
      setWorking(false);
    }
  }

  async function resetPassword() {
    if (!userData?.email) return;
    await sendPasswordResetEmail(auth, userData.email);
    setMessage(`Password reset email sent to ${userData.email}`);
  }

  async function deleteVerification() {
    if (!uid) return;
    if (!window.confirm('Delete verification files and reset verification status?')) return;
    try {
      setWorking(true); setMessage(null);
      const fn = httpsCallable(functions, 'adminDeleteStudentArtifacts');
      await fn({ uid, deleteVerification: true, resetVerificationFlag: true });
      setMessage('Verification files deleted.');
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to delete verification.');
    } finally {
      setWorking(false);
    }
  }

  async function deleteSubmission() {
    if (!uid) return;
    if (!window.confirm('Delete this student\'s submission?')) return;
    try {
      setWorking(true); setMessage(null);
      const fn = httpsCallable(functions, 'adminDeleteStudentArtifacts');
      await fn({ uid, deleteSubmission: true });
      setMessage('Submission deleted.');
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to delete submission.');
    } finally {
      setWorking(false);
    }
  }

  if (!userData) return <AdminLayout><p className="text-sm text-gray-500">Loading…</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/students" className="text-sm text-blue-700 underline">← Students</Link>
        <h1 className="text-2xl font-bold">{displayName || userData.email}</h1>
      </div>
      {message && <div className="mb-4 text-sm rounded-md bg-blue-50 text-blue-800 px-3 py-2">{message}</div>}
      <div className="max-w-2xl space-y-4">
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Profile</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveProfile} disabled={working}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium disabled:opacity-70">
              {working ? 'Saving…' : 'Save'}
            </button>
            <button onClick={resetPassword} disabled={working}
              className="px-4 py-2 rounded-lg border text-sm font-medium">
              Send Password Reset
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <h2 className="font-semibold">Verification Details</h2>
          {[
            ['Email', userData.email],
            ['Education', userData.educationLevel],
            ['School', userData.school],
            ['Level', userData.level],
            ['City', userData.city],
            ['LGA', userData.lga],
            ['Address', userData.address],
            ['DOB', userData.dob],
            ['Phone', userData.phone],
            ['Verified', String(userData.verificationComplete ?? false)],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k as string} className="text-sm">
              <span className="font-medium">{k}: </span>
              <span className="text-gray-600">{v as string}</span>
            </div>
          ))}
          {userData.verificationFiles?.passport?.url && (
            <a href={userData.verificationFiles.passport.url} target="_blank" rel="noreferrer"
              className="text-sm text-blue-700 underline">View Passport</a>
          )}
          {userData.verificationFiles?.idcard?.url && (
            <a href={userData.verificationFiles.idcard.url} target="_blank" rel="noreferrer"
              className="text-sm text-blue-700 underline">View ID Card</a>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={deleteVerification} disabled={working}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-70">
              Delete Verification Files
            </button>
            <button onClick={deleteSubmission} disabled={working}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-70">
              Delete Submission
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
