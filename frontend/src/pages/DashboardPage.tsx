// TaskManager Frontend - Dashboard page with stats and recent activity
// Author: Yusuf Alperen Bozkurt

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineBell,
  HiOutlineBolt,
} from 'react-icons/hi2';
import { useAuthStore } from '../stores/authStore';
import { taskService } from '../services/taskService';
import { approvalService } from '../services/approvalService';
import { notificationService } from '../services/notificationService';
import type { TaskDto, NotificationDto } from '../types';
import { formatDate, getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel } from '../utils/helpers';

export default function DashboardPage() {
  const { isSuperAdmin, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const [totalTasks, setTotalTasks] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [recentTasks, setRecentTasks] = useState<TaskDto[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // fetch all dashboard data in parallel for speed
      const [tasksRes, activeRes, notifCount, notifs] = await Promise.all([
        isSuperAdmin()
          ? taskService.getTasks(0, 10)
          : isAdmin()
          ? taskService.getTasks(0, 10)
          : taskService.getAssignedToMe(0, 10),
        taskService.getTasksByStatus('ACTIVE', 0, 1),
        notificationService.getUnreadCount(),
        notificationService.getUnread(),
      ]);

      setTotalTasks(tasksRes.totalElements);
      setActiveTasks(activeRes.totalElements);
      setUnreadNotifications(notifCount);
      setRecentTasks(tasksRes.content.slice(0, 10));
      setRecentNotifications(notifs.slice(0, 10));

      // only fetch pending approvals for admin users
      if (isSuperAdmin() || isAdmin()) {
        try {
          const approvals = await approvalService.getPendingApprovals(0, 1);
          setPendingApprovals(approvals.totalElements);
        } catch {
          setPendingApprovals(0);
        }
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // stat cards config - each one links to its respective page
  const stats = [
    {
      label: 'Toplam Görev',
      value: totalTasks,
      icon: HiOutlineClipboardDocumentList,
      color: 'from-indigo-500 to-blue-500',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'Onay Bekleyen',
      value: pendingApprovals,
      icon: HiOutlineClock,
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      onClick: () => navigate('/approvals'),
      visible: isSuperAdmin() || isAdmin(),
    },
    {
      label: 'Okunmamış Bildirim',
      value: unreadNotifications,
      icon: HiOutlineBell,
      color: 'from-rose-500 to-pink-500',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-600',
      onClick: () => navigate('/notifications'),
    },
    {
      label: 'Aktif Görev',
      value: activeTasks,
      icon: HiOutlineBolt,
      color: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      onClick: () => navigate('/tasks'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats
          .filter((s) => s.visible !== false)
          .map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 text-left group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
                <div className={`${stat.bgLight} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </button>
          ))}
      </div>

      {/* Recent Tasks & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Son Görevler</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Tümünü Gör
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Henüz görev yok</p>
            ) : (
              recentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(task.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Son Bildirimler</h3>
            <button
              onClick={() => navigate('/notifications')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Tümünü Gör
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentNotifications.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Henüz bildirim yok</p>
            ) : (
              recentNotifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (notif.referenceType === 'TASK' && notif.referenceId) {
                      navigate(`/tasks/${notif.referenceId}`);
                    } else {
                      navigate('/notifications');
                    }
                  }}
                  className="w-full px-6 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${notif.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
