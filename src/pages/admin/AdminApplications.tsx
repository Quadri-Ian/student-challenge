import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

interface Submission {
  id: string;
  title: string;
  author: { firstName: string; lastName: string; email: string };
  status: string;
  avgScore: number;
  percent: number;
  judgeCount: number;
  description: string;
  files: {
    images: { url: string; name: string }[];
    video: { url: string } | null;
  };
}

interface ScoreEntry {
  id: string;
  score: number;
  judgeUid: string;
  judgeEmail: string;
}

function SubmissionModal({ sub, onClose }: { sub: Submission; onClose: () => void }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    getDocs(collection(db, 'submissions', sub.id, 'scores')).then((snap) => {
      setScores(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ScoreEntry, 'id'>) })));
    });
  }, [sub.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">{sub.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-600">{sub.author?.firstName} {sub.author?.lastName} · {sub.author?.email}</p>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{sub.description}</p>
        {sub.files?.video?.url && (
          <a href={sub.files.video.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Watch Video</a>
        )}
        {sub.files?.images?.map((img, i) => (
          <a key={i} href={img.url} target="_blank" rel="noreferrer" className="block text-sm text-blue-700 underline">
            {img.name || `Image ${i + 1}`}
          </a>
        ))}
        <div>
          <h3 className="font-medium text-sm mb-2">Scores</h3>
          {scores.length === 0 ? (
            <p className="text-sm text-gray-400">No scores yet.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead><tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">Judge</th>
                <th className="text-left px-3 py-2">Score</th>
              </tr></thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="px-3 py-2">{s.judgeEmail}</td>
                    <td className="px-3 py-2">{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Applications</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Avg</th>
              <th className="text-left px-4 py-3">%</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s, i) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{s.title}</td>
                <td className="px-4 py-3">{s.author?.firstName} {s.author?.lastName}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">{s.avgScore?.toFixed(2)}</td>
                <td className="px-4 py-3">{s.percent?.toFixed(2)}%</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(s)}
                    className="px-3 py-1 rounded-lg bg-blue-700 text-white text-xs font-medium">View</button>
                </td>
              </tr>
            ))}
            {!loading && submissions.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && <SubmissionModal sub={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
