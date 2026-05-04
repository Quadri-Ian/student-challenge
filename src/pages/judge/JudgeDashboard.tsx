import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import JudgeLayout from '../../layouts/JudgeLayout';

interface Submission {
  id: string;
  title: string;
  author: { firstName: string; lastName: string; email: string };
  status: string;
  avgScore: number;
  percent: number;
  judgeCount: number;
}

interface ScoredSet {
  [sid: string]: boolean;
}

export default function JudgeDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scored, setScored] = useState<ScoredSet>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'submissions'), orderBy('percent', 'desc'), limit(100));
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
      const map: ScoredSet = {};
      snap.forEach((d) => { map[d.id] = true; });
      setScored(map);
    })();
  }, []);

  const total = submissions.length;
  const youScored = Object.keys(scored).length;
  const pending = total - youScored;
  const top10 = [...submissions].sort((a, b) => b.percent - a.percent).slice(0, 10);

  return (
    <JudgeLayout>
      <h1 className="text-2xl font-bold mb-6">Judge Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Applications', value: total },
          { label: "You've Scored", value: youScored },
          { label: 'Pending For You', value: pending },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Avg Score</th>
              <th className="text-left px-4 py-3">%</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((s, i) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{s.title}</td>
                <td className="px-4 py-3">{s.author?.firstName} {s.author?.lastName}</td>
                <td className="px-4 py-3">{s.avgScore?.toFixed(2)}</td>
                <td className="px-4 py-3">{s.percent?.toFixed(2)}%</td>
              </tr>
            ))}
            {!loading && top10.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </JudgeLayout>
  );
}
