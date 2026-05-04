import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export function SignOutButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="text-red-600 hover:text-red-700 flex items-center gap-2"
      onClick={async () => {
        await signOut(auth);
        navigate('/login', { replace: true });
      }}
    >
      Log out
    </button>
  );
}
