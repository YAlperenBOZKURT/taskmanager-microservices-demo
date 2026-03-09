import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Role } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Erişim Engellendi</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.
        </p>
        <a
          href="/"
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
