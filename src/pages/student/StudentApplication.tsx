import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import StudentLayout from '../../layouts/StudentLayout';

interface SubmissionData {
  title: string;
  description: string;
  status: string;
  files: {
    images: { url: string; name: string }[];
    video: { url: string } | null;
  };
}

export default function StudentApplication() {
  const [sub, setSub] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'submissions', user.uid), (s) => {
      setSub(s.exists() ? (s.data() as SubmissionData) : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">My Application</h1>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !sub ? (
        <p className="text-sm text-gray-500">No application submitted yet.</p>
      ) : (
        <div className="max-w-2xl bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{sub.title}</h2>
            <span className={`text-sm px-2 py-0.5 rounded-full ${sub.status === 'approved' ? 'bg-green-100 text-green-700' : sub.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {sub.status}
            </span>
          </div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{sub.description}</p>
          {sub.files?.video?.url && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Video</p>
              <a href={sub.files.video.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
                Watch Video
              </a>
            </div>
          )}
          {!!sub.files?.images?.length && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Images</p>
              <div className="flex flex-wrap gap-2">
                {sub.files.images.map((img, i) => (
                  <a key={i} href={img.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
                    {img.name || `Image ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}
