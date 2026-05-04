import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../layouts/AdminLayout';

interface StatCard {
  label: string;
  value: number | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: 'Total Users', value: null },
    { label: 'Students', value: null },
    { label: 'Judges', value: null },
    { label: 'Admins', value: null },
    { label: 'Submissions', value: null },
  ]);

  useEffect(() => {
    (async () => {
      const [total, students, judges, admins, subs] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'judge'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'))),
        getCountFromServer(collection(db, 'submissions')),
      ]);
      setStats([
        { label: 'Total Users', value: total.data().count },
        { label: 'Students', value: students.data().count },
        { label: 'Judges', value: judges.data().count },
        { label: 'Admins', value: admins.data().count },
        { label: 'Submissions', value: subs.data().count },
      ]);
    })();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value ?? '—'}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
