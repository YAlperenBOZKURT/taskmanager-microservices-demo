import { useAuthStore } from '../stores/authStore';
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import UserDashboard from '../components/dashboard/UserDashboard';

export default function DashboardPage() {
  const { isSuperAdmin, isAdmin } = useAuthStore();

  if (isSuperAdmin()) return <SuperAdminDashboard />;
  if (isAdmin()) return <AdminDashboard />;
  return <UserDashboard />;
}
