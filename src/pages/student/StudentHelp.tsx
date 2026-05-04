import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';

const FAQS = [
  {
    q: 'How do I submit my application?',
    a: 'Complete your identity verification first, then navigate to Submit Application to upload your artwork.',
  },
  {
    q: 'What file types are accepted?',
    a: 'Images (JPEG, PNG, GIF, etc.) and video files. Maximum 100MB per file.',
  },
  {
    q: 'Can I edit my submission after submitting?',
    a: 'No. Once submitted, your application cannot be edited. Contact support if you need changes.',
  },
  {
    q: 'How long does the review process take?',
    a: 'Reviews are typically completed within 2 weeks after the submission deadline.',
  },
  {
    q: 'How will I know if I\'ve been selected?',
    a: 'You will receive an email notification and your application status will update in the portal.',
  },
];

export default function StudentHelp() {
  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">Help & Support</h1>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className="space-y-1">
              <p className="font-medium text-sm">{faq.q}</p>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Still need help?</h2>
          <p className="text-sm text-gray-600 mb-4">
            If you didn't find what you're looking for, please submit a report and we'll get back to you.
          </p>
          <Link to="/student/report" className="px-4 py-2 rounded-lg bg-blue-800 text-white text-sm font-medium">
            Submit a Report
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
