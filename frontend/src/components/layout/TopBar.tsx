// TaskManager Frontend - Top bar with page title, notifications and logout
// Author: Yusuf Alperen Bozkurt

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useAuthStore } from '../../stores/authStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { notificationService } from '../../services/notificationService';

export default function TopBar() {
  const { logout } = useAuthStore();
  const { toggle } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // silent
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Panel';
    if (path === '/my') return 'Sayfam';
    if (path === '/tasks') return 'Görevler';
    if (path.startsWith('/tasks/')) return 'Görev Detayı';
    if (path === '/approvals') return 'Onay Talepleri';
    if (path === '/teams') return 'Takımlar';
    if (path === '/users') return 'Kullanıcılar';
    if (path === '/notifications') return 'Bildirimler';
    if (path === '/profile') return 'Profil';
    return '';
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 md:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <HiOutlineBars3 className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <HiOutlineBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
            title="Çıkış Yap"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
