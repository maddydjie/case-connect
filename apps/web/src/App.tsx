import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import CaseSheetListPage from '@/pages/CaseSheetListPage';
import NewCaseSheetPage from '@/pages/NewCaseSheetPage';
import CaseSheetDetailPage from '@/pages/CaseSheetDetailPage';
import OPSheetListPage from '@/pages/OPSheetListPage';
import EmergencyPage from '@/pages/EmergencyPage';
import FollowUpPage from '@/pages/FollowUpPage';
import LiveBedMapPage from '@/pages/LiveBedMapPage';
import DocuStreamPage from '@/pages/DocuStreamPage';
import AppointmentsPage from '@/pages/AppointmentsPage';
import CasePracticePage from '@/pages/CasePracticePage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ProgressPage from '@/pages/ProgressPage';
import HealthVaultPage from '@/pages/HealthVaultPage';
import PatientAppointmentsPage from '@/pages/PatientAppointmentsPage';
import TriagePage from '@/pages/TriagePage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import UserManagementPage from '@/pages/UserManagementPage';
import AuditLogPage from '@/pages/AuditLogPage';
import OnboardingPage from '@/pages/OnboardingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/doctor/case-sheets" element={<CaseSheetListPage />} />
          <Route path="/doctor/case-sheets/new" element={<NewCaseSheetPage />} />
          <Route path="/doctor/case-sheets/:id" element={<CaseSheetDetailPage />} />
          <Route path="/doctor/op-sheets" element={<OPSheetListPage />} />
          <Route path="/doctor/emergency" element={<EmergencyPage />} />
          <Route path="/doctor/follow-ups" element={<FollowUpPage />} />

          <Route path="/hms/beds" element={<LiveBedMapPage />} />
          <Route path="/hms/documents" element={<DocuStreamPage />} />
          <Route path="/hms/appointments" element={<AppointmentsPage />} />

          <Route path="/student/practice" element={<CasePracticePage />} />
          <Route path="/student/leaderboard" element={<LeaderboardPage />} />
          <Route path="/student/progress" element={<ProgressPage />} />

          <Route path="/patient/vault" element={<HealthVaultPage />} />
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/triage" element={<TriagePage />} />

          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/audit" element={<AuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
