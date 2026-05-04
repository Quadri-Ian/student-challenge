import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import JudgeLayout from '../../layouts/JudgeLayout';

interface Submission {
  id: string;
  title: string;
  author: { firstName: string; lastName: string };
  avgScore: number;
  percent: number;
  judgeCount: number;
}

export default function JudgeAnalytics() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [minAvg, setMinAvg] = useState('');
  const [maxAvg, setMaxAvg] = useState('');
  const [minPct, setMinPct] = useState('');
  const [maxPct, setMaxPct] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'submissions'), orderBy('percent', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = submissions.filter((s) => {
    if (minAvg !== '' && s.avgScore < Number(minAvg)) return false;
    if (maxAvg !== '' && s.avgScore > Number(maxAvg)) return false;
    if (minPct !== '' && s.percent < Number(minPct)) return false;
    if (maxPct !== '' && s.percent > Number(maxPct)) return false;
    return true;
  });

  const avgOfAvgs = filtered.length
    ? (filtered.reduce((sum, s) => sum + (s.avgScore || 0), 0) / filtered.length).toFixed(2)
    : '—';
  const avgPct = filtered.length
    ? (filtered.reduce((sum, s) => sum + (s.percent || 0), 0) / filtered.length).toFixed(2)
    : '—';

  return (
    <JudgeLayout>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Avg Score</label>
          <input type="number" min={0} max={10} placeholder="Min" className="border rounded px-2 py-1 w-20 text-sm"
            value={minAvg} onChange={(e) => setMinAvg(e.target.value)} />
          <span className="text-sm">–</span>
          <input type="number" min={0} max={10} placeholder="Max" className="border rounded px-2 py-1 w-20 text-sm"
            value={maxAvg} onChange={(e) => setMaxAvg(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">%</label>
          <input type="number" min={0} max={100} placeholder="Min" className="border rounded px-2 py-1 w-20 text-sm"
            value={minPct} onChange={(e) => setMinPct(e.target.value)} />
          <span className="text-sm">–</span>
          <input type="number" min={0} max={100} placeholder="Max" className="border rounded px-2 py-1 w-20 text-sm"
            value={maxPct} onChange={(e) => setMaxPct(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-6 mb-4">
        <div className="bg-white rounded-xl shadow px-5 py-3 text-sm">
          <span className="text-gray-500">Avg of averages</span>
          <span className="ml-3 font-semibold">{avgOfAvgs}</span>
        </div>
        <div className="bg-white rounded-xl shadow px-5 py-3 text-sm">
          <span className="text-gray-500">Avg %</span>
          <span className="ml-3 font-semibold">{avgPct}%</span>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Judge Count</th>
              <th className="text-left px-4 py-3">Avg Score</th>
              <th className="text-left px-4 py-3">%</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{s.title}</td>
                <td className="px-4 py-3">{s.author?.firstName} {s.author?.lastName}</td>
                <td className="px-4 py-3">{s.judgeCount}</td>
                <td className="px-4 py-3">{s.avgScore?.toFixed(2)}</td>
                <td className="px-4 py-3">{s.percent?.toFixed(2)}%</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </JudgeLayout>
  );
}
