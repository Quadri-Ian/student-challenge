import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function VerifyEmail() {
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const resend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification email sent. Check your inbox.');
    }
  };

  const checkVerified = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        navigate('/student');
      } else {
        setMessage('Still not verified. Click the email link, then press this again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p>
          We sent a verification link to <b>{auth.currentUser?.email}</b>.
        </p>
        <div className="flex gap-2">
          <button onClick={resend} className="px-3 py-2 border rounded">
            Resend link
          </button>
          <button onClick={checkVerified} className="px-3 py-2 bg-purple-700 text-white rounded">
            I verified
          </button>
        </div>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
