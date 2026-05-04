import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

interface Student {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  verificationComplete: boolean;
  educationLevel?: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Student, 'uid'>) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Students</h1>
      <div className="mb-4">
        <input placeholder="Search by name or email…" className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Education</th>
              <th className="text-left px-4 py-3">Verified</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.uid} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.educationLevel ?? '—'}</td>
                <td className="px-4 py-3">
                  {s.verificationComplete
                    ? <span className="text-green-600">Yes</span>
                    : <span className="text-red-500">No</span>}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <Link to={`/admin/students/${s.uid}`}
                    className="px-3 py-1 rounded-lg bg-blue-700 text-white text-xs font-medium">Profile</Link>
                  <Link to={`/admin/students/${s.uid}/submission`}
                    className="px-3 py-1 rounded-lg bg-gray-700 text-white text-xs font-medium">Submission</Link>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
