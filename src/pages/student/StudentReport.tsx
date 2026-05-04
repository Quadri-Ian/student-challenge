import { useState } from 'react';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import StudentLayout from '../../layouts/StudentLayout';

const CATEGORIES = ['Artwork Issue', 'Technical Issue', 'Abuse/Harassment', 'Billing', 'Other'];

export default function StudentReport() {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      setMessage('Description must be at least 10 characters.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    try {
      setSubmitting(true);
      setMessage(null);
      const docRef = await addDoc(collection(db, 'reports'), {
        uid: user.uid,
        email: user.email,
        category,
        subject,
        description,
        status: 'open',
        createdAt: serverTimestamp(),
        attachment: null,
      });
      if (screenshot) {
        const sRef = ref(storage, `reports/${docRef.id}/screenshot-${Date.now()}-${screenshot.name}`);
        await uploadBytes(sRef, screenshot);
        const url = await getDownloadURL(sRef);
        await updateDoc(doc(db, 'reports', docRef.id), { attachment: { path: sRef.fullPath, url } });
      }
      setMessage('Report submitted successfully.');
      setCategory('');
      setSubject('');
      setDescription('');
      setScreenshot(null);
    } catch (err: unknown) {
      setMessage((err as Error).message ?? 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">Report an Issue</h1>
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select className="w-full border rounded-lg px-3 py-2" required value={category}
              onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input required className="w-full border rounded-lg px-3 py-2" value={subject}
              onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea required className="w-full border rounded-lg px-3 py-2 h-28" value={description}
              onChange={(e) => setDescription(e.target.value)} />
            <p className="text-xs text-gray-500 mt-0.5">Minimum 10 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Screenshot (optional)</label>
            <input type="file" accept="image/*" className="w-full"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
          </div>
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-full bg-blue-800 text-white font-semibold disabled:opacity-70">
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </StudentLayout>
  );
}
