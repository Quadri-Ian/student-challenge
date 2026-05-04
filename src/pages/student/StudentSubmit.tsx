import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getIdTokenResult } from 'firebase/auth';
import { auth, db, storage } from '../../firebase';
import StudentLayout from '../../layouts/StudentLayout';

const PRIMARY = '#223B8F';
const ACCENT = '#68C07E';

interface SubmissionFiles {
  images: { path: string; url: string; name: string }[];
  video: { path: string; url: string } | null;
}

export default function StudentSubmit() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingFiles, setExistingFiles] = useState<SubmissionFiles | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');
      await getIdTokenResult(user, true);
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = (snap.data() || {}) as Record<string, unknown>;
      setFirstName((data.firstName as string) ?? (user.displayName ?? '').split(' ')[0] ?? '');
      setLastName((data.lastName as string) ?? (user.displayName ?? '').split(' ')[1] ?? '');
      setVerified(!!data.verificationComplete);
      if (!user.emailVerified) return navigate('/verify-email');
      if (!data.verificationComplete) return navigate('/student/verify');
      const subRef = doc(db, 'submissions', user.uid);
      unsub = onSnapshot(subRef, (s) => {
        if (s.exists()) {
          setAlreadySubmitted(true);
          const d = s.data();
          setTitle(d.title || '');
          setDescription(d.description || '');
          setExistingFiles(d.files || null);
        } else {
          setAlreadySubmitted(false);
          setExistingFiles(null);
        }
      });
    })();
    return () => { if (unsub) unsub(); };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return navigate('/login');
    const result = await getIdTokenResult(user, true);
    if ((result.claims.role ?? null) !== 'student') {
      setMessage('Only students can submit applications with this account.');
      return;
    }
    if (!verified) { setMessage('Please complete verification first.'); navigate('/student/verify'); return; }
    if (alreadySubmitted) { setMessage('You have already submitted an application.'); return; }
    try {
      setSubmitting(true);
      const subRef = doc(db, 'submissions', user.uid);
      await setDoc(subRef, {
        uid: user.uid,
        author: { firstName, lastName, email: user.email },
        title,
        description,
        status: 'pending',
        createdAt: serverTimestamp(),
        files: { images: [], video: null },
        scoreSum: 0,
        judgeCount: 0,
        avgScore: 0,
        percent: 0,
      });
      let video: { path: string; url: string } | null = null;
      if (videoFile) {
        if (videoFile.size > 100 * 1024 * 1024) throw new Error('Video exceeds 100MB');
        const vRef = ref(storage, `submissions/${user.uid}/video-${Date.now()}-${videoFile.name}`);
        await uploadBytes(vRef, videoFile);
        video = { path: vRef.fullPath, url: await getDownloadURL(vRef) };
      }
      const images: { path: string; url: string; name: string }[] = [];
      if (imageFiles?.length) {
        for (const file of Array.from(imageFiles)) {
          if (file.size > 100 * 1024 * 1024) throw new Error(`Image ${file.name} exceeds 100MB`);
          const iRef = ref(storage, `submissions/${user.uid}/img-${Date.now()}-${file.name}`);
          await uploadBytes(iRef, file);
          images.push({ path: iRef.fullPath, url: await getDownloadURL(iRef), name: file.name });
        }
      }
      await updateDoc(subRef, { files: { images, video } });
      setMessage('Application submitted!');
      setAlreadySubmitted(true);
      setExistingFiles({ images, video });
      formRef.current?.reset();
      setVideoFile(null);
      setImageFiles(null);
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">
        Welcome Back, <span className="text-gray-900">{firstName || 'Student'}</span>
      </h1>
      <div className="max-w-2xl relative">
        {alreadySubmitted && (
          <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-[2px] grid place-items-center text-center p-6">
            <div className="space-y-2">
              <div className="text-lg font-semibold" style={{ color: PRIMARY }}>You've already submitted your application</div>
              <p className="text-sm text-gray-700">Please await results. You can still view your details below.</p>
            </div>
          </div>
        )}
        <form ref={formRef} onSubmit={handleSubmit} className="rounded-xl p-2 md:p-6 shadow space-y-4" style={{ backgroundColor: ACCENT }}>
          <h2 className="font-semibold text-lg text-white">Eko Arts and Crafts 2025</h2>
          <div className="flex gap-3">
            <input className="flex-1 w-1/2 rounded-lg px-3 py-2" value={firstName} disabled />
            <input className="flex-1 w-1/2 rounded-lg px-3 py-2" value={lastName} disabled />
          </div>
          <input className="w-full rounded-lg px-3 py-2" placeholder="Artwork Title" value={title}
            onChange={(e) => setTitle(e.target.value)} required disabled={alreadySubmitted || submitting} />
          <textarea className="w-full rounded-lg px-3 py-2 h-28" placeholder="Artwork Description" value={description}
            onChange={(e) => setDescription(e.target.value)} required disabled={alreadySubmitted || submitting} />
          <div>
            <label className="block text-white mb-1">Upload Artwork Video (max 100MB)</label>
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg px-3 py-2 bg-white" disabled={alreadySubmitted || submitting} />
            <p className="text-xs text-white/90">Max file size: 100mb</p>
          </div>
          <div>
            <label className="block text-white mb-1">Upload Artwork Images (max 100MB each)</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(e.target.files)}
              className="w-full rounded-lg px-3 py-2 bg-white" required={!videoFile && !alreadySubmitted}
              disabled={alreadySubmitted || submitting} />
            <p className="text-xs text-white/90">Max file size: 100mb</p>
          </div>
          <button disabled={alreadySubmitted || submitting} className="w-full py-3 rounded-full text-white font-semibold"
            style={{ backgroundColor: PRIMARY }}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
          {existingFiles && (
            <div className="text-sm text-white/95 space-y-2">
              {existingFiles.video?.url && (
                <a href={existingFiles.video.url} target="_blank" rel="noreferrer" className="underline" style={{ color: PRIMARY }}>
                  View uploaded video
                </a>
              )}
              {existingFiles.images?.length ? (
                <div className="flex flex-wrap gap-2">
                  {existingFiles.images.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noreferrer" className="underline text-sm" style={{ color: PRIMARY }}>
                      {img.name || `Image ${i + 1}`}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {message && <p className="text-sm text-white/90">{message}</p>}
        </form>
      </div>
    </StudentLayout>
  );
}
