import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { slide1, slide2, slide3, slide4, logoUrl } from '../assets';

const slides = [slide1, slide2, slide3, slide4, slide1];

function parseRegisterError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    default:
      return 'Registration failed. Please try again.';
  }
}

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const slidesRef = useRef(slides);
  const [slideIdx, setSlideIdx] = useState(0);
  const total = slidesRef.current.length;

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      user.getIdToken(true).finally(() => navigate('/after-login'));
    }
  }, [navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const start = () => { timer = window.setInterval(() => setSlideIdx((i) => (i + 1) % total), 4000); };
    const stop = () => clearInterval(timer);
    start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [total]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) return setError('Please enter your first and last name.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    try {
      setLoading(true);
      const emailLower = email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, emailLower, password);
      await updateProfile(cred.user, { displayName: `${firstName.trim()} ${lastName.trim()}` });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: emailLower,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        educationLevel: educationLevel || null,
        verificationComplete: false,
        createdAt: serverTimestamp(),
      }, { merge: true });
      await sendEmailVerification(cred.user);
      navigate('/verify-email');
    } catch (err) {
      setError(parseRegisterError(err));
    } finally {
      setLoading(false);
    }
  }

  const prev = () => setSlideIdx((i) => (i - 1 + total) % total);
  const next = () => setSlideIdx((i) => (i + 1) % total);

  return (
    <div className="min-h-screen grid space-x-6 w-full md:grid-cols-2">
      {/* Slideshow */}
      <div className="hidden md:flex items-stretch p-8">
        <div className="relative w-full rounded-[2rem] overflow-hidden">
          {slidesRef.current.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`Slide ${i + 1}`}
              className={[
                'absolute inset-0 w-full h-full object-cover',
                'transition-all duration-700 ease-out will-change-transform',
                i === slideIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
              ].join(' ')}
              draggable={false}
            />
          ))}
          <p className="absolute bottom-5 left-6 text-xs tracking-wide text-white/90 drop-shadow">
            {slideIdx + 1} <span className="opacity-80">of</span> {total}
          </p>
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <button type="button" onClick={prev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:opacity-90"
              aria-label="Previous">‹</button>
            <button type="button" onClick={next}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:opacity-90"
              aria-label="Next">›</button>
          </div>
        </div>
      </div>
      {/* Form */}
      <div className="flex flex-col justify-center gap-6 px-6 py-10 md:px-10">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-12 w-auto" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Already have an account?{' '}
            <a href="/login" className="underline text-blue-700">Sign in</a>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input className="w-full border rounded-lg px-3 py-2" required value={firstName}
                onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input className="w-full border rounded-lg px-3 py-2" required value={lastName}
                onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required autoComplete="email" className="w-full border rounded-lg px-3 py-2"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Education Level</label>
            <select className="w-full border rounded-lg px-3 py-2" value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}>
              <option value="">Select…</option>
              <option value="Primary Education">Primary Education</option>
              <option value="Secondary Education">Secondary Education</option>
              <option value="Tertiary Education">Tertiary Education</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required autoComplete="new-password" className="w-full border rounded-lg px-3 py-2"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" required autoComplete="new-password" className="w-full border rounded-lg px-3 py-2"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-full bg-[#1E40AF] text-white font-semibold disabled:opacity-70">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
