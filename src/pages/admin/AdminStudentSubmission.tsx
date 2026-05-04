import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

interface SubmissionData {
  title: string;
  description: string;
  status: string;
  scoreSum: number;
  judgeCount: number;
  avgScore: number;
  percent: number;
  files: {
    images: { url: string; name: string }[];
    video: { url: string } | null;
  };
  author: { firstName: string; lastName: string; email: string };
}

export default function AdminStudentSubmission() {
  const { uid } = useParams<{ uid: string }>();
  const [sub, setSub] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'submissions', uid), (s) => {
      setSub(s.exists() ? (s.data() as SubmissionData) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/admin/students/${uid}`} className="text-sm text-blue-700 underline">← Profile</Link>
        <h1 className="text-2xl font-bold">Submission</h1>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !sub ? (
        <p className="text-sm text-gray-500">No submission found for this student.</p>
      ) : (
        <div className="max-w-2xl bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{sub.title}</h2>
            <span className={`text-sm px-2 py-0.5 rounded-full ${sub.status === 'approved' ? 'bg-green-100 text-green-700' : sub.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {sub.status}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {sub.author?.firstName} {sub.author?.lastName} · {sub.author?.email}
          </p>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{sub.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Judge Count:</span> {sub.judgeCount}</div>
            <div><span className="font-medium">Score Sum:</span> {sub.scoreSum}</div>
            <div><span className="font-medium">Avg Score:</span> {sub.avgScore?.toFixed(2)}</div>
            <div><span className="font-medium">Percent:</span> {sub.percent?.toFixed(2)}%</div>
          </div>
          {sub.files?.video?.url && (
            <a href={sub.files.video.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
              Watch Video
            </a>
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
    </AdminLayout>
  );
}
