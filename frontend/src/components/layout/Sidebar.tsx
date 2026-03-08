// TaskManager Frontend - Sidebar navigation component
// Author: Yusuf Alperen Bozkurt

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
} from 'react-icons/hi2';
import { useAuthStore } from '../../stores/authStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { getInitials, getRoleLabel, getHighestRole } from '../../utils/helpers';
import TicketModal from '../modals/TicketModal';

export default function Sidebar() {
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const { isOpen, close } = useSidebarStore();
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // define the navigation menu items, some are role-based
  const menuItems = [
    {
      path: '/',
      icon: HiOutlineHome,
      label: 'Panel',
      visible: true,
    },
    {
      path: '/approvals',
      icon: HiOutlineCheckCircle,
      label: 'Onay Talepleri',
      visible: isSuperAdmin() || isAdmin(),
    },
    {
      path: '/tasks',
      icon: HiOutlineClipboardDocumentList,
      label: 'Görevler',
      visible: true,
    },
    {
      path: '/users',
      icon: HiOutlineUsers,
      label: 'Kullanıcılar',
      visible: isSuperAdmin() || isAdmin(),
    },
    {
      path: '/notifications',
      icon: HiOutlineBell,
      label: 'Bildirimler',
      visible: true,
    },
    {
      path: '/profile',
      icon: HiOutlineUser,
      label: 'Profil',
      visible: true,
    },
  ];

  const highestRole = user ? getHighestRole(user.roles) : null;

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

        {/* Navigation - only show items the user has permission for */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Ticket button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setTicketModalOpen(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200"
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
