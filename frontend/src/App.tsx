import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Role } from './types';
import Layout from './components/layout/Layout';
import RoleGuard from './components/guards/RoleGuard';
import Toaster from './components/ui/Toaster';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ApprovalsPage from './pages/ApprovalsPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import TaskDetailPage from './pages/TaskDetailPage';
import TeamsPage from './pages/TeamsPage';
import MyPage from './pages/MyPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      <Toaster />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/my" element={<MyPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
                  <Route
                    path="/approvals"
                    element={
                      <RoleGuard allowedRoles={[Role.ROLE_ADMIN, Role.ROLE_SUPER_ADMIN]}>
                        <ApprovalsPage />
                      </RoleGuard>
                    }
                  />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
