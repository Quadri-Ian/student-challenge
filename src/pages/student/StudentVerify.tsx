import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import StudentLayout from '../../layouts/StudentLayout';

const PRIMARY = '#223B8F';
const ACCENT = '#68C07E';

type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  education: string;
  school: string;
  level: string;
  city: string;
  lga: string;
  address: string;
  dob: string;
  phone: string;
};

function withTimeout<T>(p: Promise<T>, ms = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Upload timed out')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

export default function StudentVerify() {
  const [form, setForm] = useState<FormFields>({
    firstName: '', lastName: '', email: '', education: 'Tertiary Education',
    school: '', level: '', city: '', lga: '', address: '', dob: '', phone: '',
  });
  const [passport, setPassport] = useState<File | null>(null);
  const [idcard, setIdcard] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = (snap.data() || {}) as Record<string, string | boolean>;
      const [fn = '', ln = ''] = data.firstName && data.lastName
        ? [data.firstName as string, data.lastName as string]
        : (user.displayName ?? '').split(' ');
      setForm((f) => ({
        ...f,
        firstName: (data.firstName as string) ?? fn,
        lastName: (data.lastName as string) ?? ln,
        email: (data.email as string) ?? user.email ?? '',
        education: (data.educationLevel as string) ?? f.education,
        school: (data.school as string) ?? '',
        level: (data.level as string) ?? '',
        city: (data.city as string) ?? '',
        lga: (data.lga as string) ?? '',
        address: (data.address as string) ?? '',
        dob: (data.dob as string) ?? '',
        phone: (data.phone as string) ?? '',
      }));
      if (data.verificationComplete) setDone(true);
    })();
  }, [navigate]);

  function setField(k: keyof FormFields, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (done) { setMessage('Verification already completed.'); return; }
    try {
      setSubmitting(true);
      setMessage(null);
      await user.getIdToken(true);
      const uid = user.uid;

      async function uploadFile(name: string, file: File | null) {
        if (!file) return null;
        if (file.size > 10 * 1024 * 1024) throw new Error(`${name} exceeds 10MB`);
        const storageRef = ref(storage, `users/${uid}/verification/${name}-${Date.now()}-${file.name}`);
        await withTimeout(uploadBytes(storageRef, file));
        const url = await withTimeout(getDownloadURL(storageRef));
        return { path: storageRef.fullPath, url };
      }

      const verificationFiles = {
        passport: await uploadFile('passport', passport),
        idcard: await uploadFile('idcard', idcard),
      };

      await setDoc(doc(db, 'users', uid), {
        ...form,
        uid,
        verificationFiles,
        verificationComplete: true,
        verificationAt: serverTimestamp(),
      }, { merge: true });

      setMessage('Verification submitted. Redirecting to application…');
      setDone(true);
      navigate('/student/submit');
    } catch (err: unknown) {
      const msg = String((err as Error)?.message || '');
      if (/CORS|preflight|Failed to fetch/i.test(msg)) {
        setMessage('Upload was blocked by the browser. Please refresh and try again.');
      } else {
        setMessage(msg || 'Failed to submit verification.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">
        Welcome Back, <span className="text-gray-900">{form.firstName || 'Student'}</span>
      </h1>
      <div className="max-w-2xl relative">
        {done && (
          <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-[2px] grid place-items-center text-center p-6">
            <div className="space-y-2">
              <div className="text-lg font-semibold" style={{ color: PRIMARY }}>Verification completed</div>
              <p className="text-sm text-gray-700">You can now submit your application.</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="rounded-xl p-2 md:p-6 shadow space-y-4" style={{ backgroundColor: ACCENT }}>
          <h2 className="font-semibold text-lg text-white">Identity Verification</h2>
          <div className="flex gap-3">
            <input className="flex-1 w-1/2 rounded-lg px-3 py-2" value={form.firstName} disabled />
            <input className="flex-1 w-1/2 rounded-lg px-3 py-2" value={form.lastName} disabled />
          </div>
          <input className="w-full rounded-lg px-3 py-2" value={form.email} disabled />
          <input className="w-full rounded-lg px-3 py-2" placeholder="Name of School" value={form.school}
            onChange={(e) => setField('school', e.target.value)} disabled={done || submitting} />
          <input className="w-full rounded-lg px-3 py-2" placeholder="Current Level" value={form.level}
            onChange={(e) => setField('level', e.target.value)} disabled={done || submitting} />
          <div className="flex gap-3">
            <input className="w-1/2 md:flex-1 rounded-lg px-3 py-2" placeholder="City" value={form.city}
              onChange={(e) => setField('city', e.target.value)} disabled={done || submitting} />
            <input className="w-1/2 md:flex-1 rounded-lg px-3 py-2" placeholder="Local Government" value={form.lga}
              onChange={(e) => setField('lga', e.target.value)} disabled={done || submitting} />
          </div>
          <input className="w-full rounded-lg px-3 py-2" placeholder="House Address" value={form.address}
            onChange={(e) => setField('address', e.target.value)} disabled={done || submitting} />
          <label className="block text-white mb-1">Date of Birth</label>
          <input type="date" className="w-full rounded-lg px-3 py-2" value={form.dob}
            onChange={(e) => setField('dob', e.target.value)} disabled={done || submitting} />
          <input className="w-full rounded-lg px-3 py-2" placeholder="Phone Number" value={form.phone}
            onChange={(e) => setField('phone', e.target.value)} disabled={done || submitting} />
          <div>
            <label className="block text-white mb-1">Upload Passport Image (max 10MB)</label>
            <input type="file" accept="image/*"
              onChange={(e) => setPassport(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg px-3 py-2 bg-white" disabled={done || submitting} />
          </div>
          <div>
            <label className="block text-white mb-1">Upload ID Card (max 10MB)</label>
            <input type="file" accept="image/*"
              onChange={(e) => setIdcard(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg px-3 py-2 bg-white" disabled={done || submitting} />
          </div>
          <button disabled={done || submitting} className="w-full py-3 rounded-full text-white font-semibold"
            style={{ backgroundColor: PRIMARY }}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
          {message && <p className="text-sm text-white/90">{message}</p>}
        </form>
      </div>
    </StudentLayout>
  );
}
