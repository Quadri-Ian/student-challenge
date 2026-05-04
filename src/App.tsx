import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GuestGuard } from './components/GuestGuard';
import { RoleGuard } from './components/RoleGuard';

import AfterLogin from './pages/AfterLogin';
import SetupAdmin from './pages/SetupAdmin';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

import StudentRoute from './pages/student/StudentRoute';
import StudentVerify from './pages/student/StudentVerify';
import StudentSubmit from './pages/student/StudentSubmit';
import StudentApplication from './pages/student/StudentApplication';
import StudentSettings from './pages/student/StudentSettings';
import StudentReport from './pages/student/StudentReport';
import StudentHelp from './pages/student/StudentHelp';

import JudgeDashboard from './pages/judge/JudgeDashboard';
import JudgeApplications from './pages/judge/JudgeApplications';
import JudgeApplicants from './pages/judge/JudgeApplicants';
import JudgeAnalytics from './pages/judge/JudgeAnalytics';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminJudges from './pages/admin/AdminJudges';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStudentDetail from './pages/admin/AdminStudentDetail';
import AdminStudentSubmission from './pages/admin/AdminStudentSubmission';
import AdminApplications from './pages/admin/AdminApplications';
import AdminReports from './pages/admin/AdminReports';
import AdminAnalytics from './pages/admin/AdminAnalytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/after-login" replace />} />
        <Route path="/after-login" element={<AfterLogin />} />
        <Route path="/setup-admin" element={<SetupAdmin />} />
        <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><Register /></GuestGuard>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/student" element={<StudentRoute />} />
        <Route path="/student/verify" element={<StudentVerify />} />
        <Route path="/student/submit" element={<StudentSubmit />} />
        <Route path="/student/application" element={<StudentApplication />} />
        <Route path="/student/settings" element={<StudentSettings />} />
        <Route path="/student/report" element={<StudentReport />} />
        <Route path="/student/help" element={<StudentHelp />} />
        <Route
          path="/judge"
          element={<RoleGuard allow={['judge', 'admin']}><Outlet /></RoleGuard>}
        >
          <Route index element={<JudgeDashboard />} />
          <Route path="applications" element={<JudgeApplications />} />
          <Route path="applicants" element={<JudgeApplicants />} />
          <Route path="analytics" element={<JudgeAnalytics />} />
        </Route>
        <Route
          path="/admin"
          element={<RoleGuard allow={['admin']}><Outlet /></RoleGuard>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="judges" element={<AdminJudges />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/:uid" element={<AdminStudentDetail />} />
          <Route path="students/:uid/submission" element={<AdminStudentSubmission />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/after-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
