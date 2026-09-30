import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ExecutiveDashboard } from './dashboard/ExecutiveDashboard';
import { ManagerDashboard } from './dashboard/ManagerDashboard';
import { MyWorkPage } from './work/MyWorkPage';

export function HomePage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (['VP', 'ADMIN', 'SUPER_ADMIN'].includes(user.role.name)) return <ExecutiveDashboard />;
  if (['MANAGER', 'DEPARTMENT_HEAD'].includes(user.role.name)) return <ManagerDashboard />;
  return <MyWorkPage />;
}
