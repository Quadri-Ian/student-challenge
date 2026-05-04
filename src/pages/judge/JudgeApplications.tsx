import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import JudgeLayout from '../../layouts/JudgeLayout';

interface Submission {
  id: string;
  title: string;
  author: { firstName: string; lastName: string; email: string };
  status: string;
  description: string;
  files: {
    images: { url: string; name: string }[];
    video: { url: string } | null;
  };
}

function ScoreModal({
  sub,
  onClose,
  onScored,
}: {
  sub: Submission;
  onClose: () => void;
  onScored: (sid: string) => void;
}) {
  const [score, setScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  async function submit() {
    const n = Number(score);
    if (isNaN(n) || n < 0 || n > 10) { setError('Score must be 0–10.'); return; }
    if (!user) return;
    try {
      setSaving(true);
      setError(null);
      const scoreData = { score: n, judgeUid: user.uid, judgeEmail: user.email, createdAt: serverTimestamp() };
      await setDoc(doc(db, 'submissions', sub.id, 'scores', user.uid), scoreData);
      await setDoc(doc(db, 'judgeScores', user.uid, 'subs', sub.id), {
        sid: sub.id,
        judgeUid: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      onScored(sub.id);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to save score.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-xl shadow-xl p-6 space-y-4" style={{ backgroundColor: '#68C07E' }}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-white">{sub.title}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">×</button>
        </div>
        <p className="text-white/90 text-sm">{sub.author?.firstName} {sub.author?.lastName} · {sub.author?.email}</p>
        <p className="text-white/80 text-sm whitespace-pre-wrap">{sub.description}</p>
        {sub.files?.video?.url && (
          <a href={sub.files.video.url} target="_blank" rel="noreferrer" className="text-sm underline text-white/90">Watch Video</a>
        )}
        {sub.files?.images?.map((img, i) => (
          <a key={i} href={img.url} target="_blank" rel="noreferrer" className="block text-sm underline text-white/90">
            {img.name || `Image ${i + 1}`}
          </a>
        ))}
        <div>
          <label className="block text-white text-sm mb-1">Score (0–10)</label>
          <input type="number" min={0} max={10} step={0.1} className="w-full rounded-lg px-3 py-2"
            value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-900">{error}</p>}
        <button onClick={submit} disabled={saving}
          className="w-full py-3 rounded-full text-white font-semibold disabled:opacity-70"
          style={{ backgroundColor: '#1A0B3F' }}>
          {saving ? 'Saving…' : 'Submit Score'}
        </button>
      </div>
    </div>
  );
}

export default function JudgeApplications() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scored, setScored] = useState<Record<string, boolean>>({});
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    (async () => {
      const snap = await getDocs(collection(db, 'judgeScores', user.uid, 'subs'));
      const map: Record<string, boolean> = {};
      snap.forEach((d) => { map[d.id] = true; });
      setScored(map);
    })();
  }, []);

  function markScored(sid: string) {
    setScored((s) => ({ ...s, [sid]: true }));
  }

  return (
    <JudgeLayout>
      <h1 className="text-2xl font-bold mb-6">Applications</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Status</th>
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
                <td className="px-4 py-3">
                  {scored[s.id] ? (
                    <span className="text-green-600 font-medium">Scored ✓</span>
                  ) : (
                    <button onClick={() => setSelected(s)}
                      className="px-3 py-1 rounded-lg bg-blue-700 text-white text-xs font-medium">
                      Score
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && submissions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <ScoreModal sub={selected} onClose={() => setSelected(null)} onScored={markScored} />
      )}
    </JudgeLayout>
  );
}
