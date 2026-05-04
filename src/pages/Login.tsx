import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  getIdTokenResult,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { slide1, slide2, slide3, slide4, logoUrl } from '../assets';

const slides = [slide1, slide2, slide3, slide4, slide1];

function parseLoginError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'We couldn\'t sign you in. Please try again.';
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const slidesRef = useRef(slides);
  const [slideIdx, setSlideIdx] = useState(0);
  const total = slidesRef.current.length;

  useEffect(() => {
    if (auth.currentUser) navigate('/after-login');
  }, [navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const start = () => {
      timer = window.setInterval(() => setSlideIdx((i) => (i + 1) % total), 4000);
    };
    const stop = () => clearInterval(timer);
    start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [total]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetMsg(null);
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      await user.getIdToken(true);
      await getIdTokenResult(user, true);
      navigate('/after-login');
    } catch (err) {
      setError(parseLoginError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError(null);
    setResetMsg(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email above to reset your password.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setResetMsg(`If an account exists for ${trimmed}, we've sent password reset instructions.`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setResetMsg(`If an account exists for ${trimmed}, we've sent password reset instructions.`);
      }
    } finally {
      setResetLoading(false);
    }
  }

  const prev = () => setSlideIdx((i) => (i - 1 + total) % total);
  const next = () => setSlideIdx((i) => (i + 1) % total);

  return (
    <div className="min-h-screen items-center w-full bg-white text-[#140a2e]">
      <div className="mx-auto items-center justify-center grid space-x-12 max-w-7xl grid-cols-1 gap-8 px-6 py-10 md:px-10 lg:grid-cols-2">
        {/* Slideshow */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="order-2 lg:order-1 items-center justify-center">
            <div className="relative h-[60vh] rounded-[28px] bg-amber-500 md:h-[68vh] lg:h-[80vh] overflow-hidden">
              {slidesRef.current.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={`Slide ${i + 1}`}
                  className={[
                    'absolute inset-0 h-full w-full object-cover',
                    'transition-all duration-700 ease-out will-change-transform',
                    i === slideIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
                  ].join(' ')}
                  draggable={false}
                  decoding="async"
                />
              ))}
              <p className="absolute bottom-5 left-6 text-xs tracking-wide text-white/90 drop-shadow">
                {slideIdx + 1} <span className="opacity-80">of</span> {total}
              </p>
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={prev}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#140a2e] shadow-sm transition-opacity hover:opacity-90"
                  aria-label="Previous slide"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#140a2e] shadow-sm transition-opacity hover:opacity-90"
                  aria-label="Next slide"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Form */}
        <div className="flex flex-col justify-center gap-6 order-1 lg:order-2">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-12 w-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">
              Don&apos;t have an account?{' '}
              <a href="/register" className="underline text-blue-700">Register</a>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {resetMsg && <p className="text-sm text-gray-600">{resetMsg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#1E40AF] text-white font-semibold disabled:opacity-70"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetLoading}
            className="text-sm text-blue-700 underline text-left disabled:opacity-60"
          >
            {resetLoading ? 'Sending…' : 'Forgot password?'}
          </button>
        </div>
      </div>
    </div>
  );
}
