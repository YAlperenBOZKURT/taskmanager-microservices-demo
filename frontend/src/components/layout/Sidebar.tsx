import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineTicket,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import { useAuthStore } from '../../stores/authStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { getInitials, getRoleLabel, getHighestRole } from '../../utils/helpers';
import TicketModal from '../modals/TicketModal';

export default function Sidebar() {
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const { isOpen, close } = useSidebarStore();
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  const highestRole = user ? getHighestRole(user.roles) : null;

  const roleConfig = {
    ROLE_SUPER_ADMIN: { label: 'Super Admin', color: 'from-purple-500 to-indigo-600', badge: 'bg-purple-100 text-purple-700', icon: HiOutlineShieldCheck },
    ROLE_ADMIN: { label: 'Admin', color: 'from-blue-500 to-cyan-600', badge: 'bg-blue-100 text-blue-700', icon: HiOutlineShieldCheck },
    ROLE_USER: { label: 'Kullanıcı', color: 'from-indigo-400 to-purple-500', badge: 'bg-slate-100 text-slate-600', icon: HiOutlineUser },
  };

  const currentRoleConfig = highestRole ? roleConfig[highestRole] : roleConfig.ROLE_USER;

  const menuItems = [
    {
      path: '/',
      icon: HiOutlineHome,
      label: 'Panel',
      visible: true,
      description: 'Genel bakış',
    },
    {
      path: '/my',
      icon: HiOutlineDocumentText,
      label: 'Sayfam',
      visible: true,
      description: 'Taleplerim',
    },
    {
      path: '/tasks',
      icon: HiOutlineClipboardDocumentList,
      label: 'Görevler',
      visible: true,
      description: isSuperAdmin() ? 'Tüm görevler' : isAdmin() ? 'Takım görevleri' : 'Görevlerim',
    },
    {
      path: '/approvals',
      icon: HiOutlineCheckCircle,
      label: 'Onay Talepleri',
      visible: isSuperAdmin() || isAdmin(),
      description: 'Onay bekleyenler',
    },
    {
      path: '/teams',
      icon: HiOutlineBuildingOffice2,
      label: 'Takımlar',
      visible: true,
      description: isSuperAdmin() ? 'Tüm takımlar' : 'Takımlarım',
    },
    {
      path: '/users',
      icon: HiOutlineUsers,
      label: 'Kullanıcılar',
      visible: true,
      description: isSuperAdmin() ? 'Kullanıcı yönetimi' : 'Takım üyeleri',
    },
    {
      path: '/notifications',
      icon: HiOutlineBell,
      label: 'Bildirimler',
      visible: true,
      description: 'Bildirimlerim',
    },
    {
      path: '/profile',
      icon: HiOutlineUser,
      label: 'Profil',
      visible: true,
      description: 'Hesap ayarları',
    },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-[280px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">TM</span>
            </div>
            <h1 className="text-lg font-bold text-slate-800">TaskManager</h1>
          </div>
          <button
            onClick={close}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Role Indicator */}
        <div className="px-4 pt-4 pb-2">
          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl ${currentRoleConfig.badge} bg-opacity-50`}>
            <currentRoleConfig.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold tracking-wide">{currentRoleConfig.label}</span>
            {user?.teams && user.teams.length > 0 && (
              <span className="ml-auto text-[10px] font-medium opacity-70">
                {user.teams.length} takım
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block">{item.label}</span>
                </div>
              </NavLink>
            ))}
        </nav>

        {/* Ticket button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setTicketModalOpen(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 border border-dashed border-slate-200 hover:border-amber-300"
          >
            <HiOutlineTicket className="w-5 h-5 flex-shrink-0" />
            <span>Ticket Oluştur</span>
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-slate-100 px-4 py-4">
          <NavLink
            to="/profile"
            onClick={close}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentRoleConfig.color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-slate-500">
                {highestRole ? getRoleLabel(highestRole) : ''}
              </p>
            </div>
          </NavLink>
        </div>
      </aside>

      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
      />
    </>
  );
}
