import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import JudgeLayout from '../../layouts/JudgeLayout';

interface Student {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  educationLevel?: string;
  school?: string;
  level?: string;
  city?: string;
  lga?: string;
  address?: string;
  dob?: string;
  verificationFiles?: {
    passport: { url: string } | null;
    idcard: { url: string } | null;
  };
}

function ApplicantModal({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 space-y-3 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">{student.firstName} {student.lastName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {[
          ['Email', student.email],
          ['Phone', student.phone],
          ['Education Level', student.educationLevel],
          ['School', student.school],
          ['Level', student.level],
          ['City', student.city],
          ['LGA', student.lga],
          ['Address', student.address],
          ['Date of Birth', student.dob],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k as string} className="text-sm">
            <span className="font-medium text-gray-700">{k}: </span>
            <span className="text-gray-600">{v as string}</span>
          </div>
        ))}
        {student.verificationFiles?.passport?.url && (
          <a href={student.verificationFiles.passport.url} target="_blank" rel="noreferrer"
            className="text-sm text-blue-700 underline">View Passport</a>
        )}
        {student.verificationFiles?.idcard?.url && (
          <a href={student.verificationFiles.idcard.url} target="_blank" rel="noreferrer"
            className="text-sm text-blue-700 underline">View ID Card</a>
        )}
      </div>
    </div>
  );
}

export default function JudgeApplicants() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('verificationComplete', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Student, 'uid'>) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <JudgeLayout>
      <h1 className="text-2xl font-bold mb-6">Applicants</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Education</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.uid} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.educationLevel}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(s)}
                    className="px-3 py-1 rounded-lg bg-blue-700 text-white text-xs font-medium">View</button>
                </td>
              </tr>
            ))}
            {!loading && students.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No verified applicants yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && <ApplicantModal student={selected} onClose={() => setSelected(null)} />}
    </JudgeLayout>
  );
}
