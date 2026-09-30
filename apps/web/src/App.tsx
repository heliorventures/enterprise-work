import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/auth/PasswordPages';
import { HomePage } from './pages/HomePage';
import { MyWorkPage } from './pages/work/MyWorkPage';
import { WorkListPage } from './pages/work/WorkListPage';
import { WorkCreatePage } from './pages/work/WorkCreatePage';
import { WorkDetailPage } from './pages/work/WorkDetailPage';
import { ProcessesPage, ProcessDetailPage } from './pages/processes/ProcessesPage';
import { ResourcesPage, EmployeeProfilePage } from './pages/resources/ResourcesPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { DepartmentsPage, TeamsPage } from './pages/admin/OrgPages';
import { RolesPage } from './pages/admin/RolesPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, loading } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user && !loading ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-work" element={<MyWorkPage />} />
            <Route path="/work" element={<WorkListPage />} />
            <Route path="/work/new" element={<WorkCreatePage />} />
            <Route path="/work/:id" element={<WorkDetailPage />} />
            <Route path="/processes" element={<ProcessesPage />} />
            <Route path="/processes/:id" element={<ProcessDetailPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/:id" element={<EmployeeProfilePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/teams" element={<TeamsPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
