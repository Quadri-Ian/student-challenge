import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

interface Report {
  id: string;
  uid: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  attachment?: { url: string } | null;
  createdAt?: { seconds: number };
}

function ReportModal({ report, onClose, onStatusChange }: {
  report: Report;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function setStatus(status: string) {
    setSaving(true);
    await updateDoc(doc(db, 'reports', report.id), { status });
    onStatusChange(report.id, status);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">{report.subject}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="text-sm space-y-1">
          <p><span className="font-medium">From:</span> {report.email}</p>
          <p><span className="font-medium">Category:</span> {report.category}</p>
          <p><span className="font-medium">Status:</span> {report.status}</p>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>
        {report.attachment?.url && (
          <a href={report.attachment.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
            View Screenshot
          </a>
        )}
        <div className="flex gap-2">
          <button onClick={() => setStatus('in-progress')} disabled={saving || report.status === 'in-progress'}
            className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-xs font-medium disabled:opacity-70">
            In Progress
          </button>
          <button onClick={() => setStatus('closed')} disabled={saving || report.status === 'closed'}
            className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-medium disabled:opacity-70">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function handleStatusChange(id: string, status: string) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected((r) => r ? { ...r, status } : r);
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Subject</th>
              <th className="text-left px-4 py-3">From</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{r.subject}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'open' ? 'bg-yellow-100 text-yellow-700' : r.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(r)}
                    className="px-3 py-1 rounded-lg bg-blue-700 text-white text-xs font-medium">Open</button>
                </td>
              </tr>
            ))}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No reports.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && <ReportModal report={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />}
    </AdminLayout>
  );
}
