import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTicket,
  HiOutlineBell,
} from 'react-icons/hi2';
import { taskService } from '../../services/taskService';
import { approvalService } from '../../services/approvalService';
import { ticketService } from '../../services/ticketService';
import { notificationService } from '../../services/notificationService';
import type { TaskDto, TaskApprovalRequestDto, TicketDto, NotificationDto } from '../../types';
import { formatDate, getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel, getApprovalStatusColor } from '../../utils/helpers';

export default function UserDashboard() {
  const navigate = useNavigate();

  const [assignedTasks, setAssignedTasks] = useState<TaskDto[]>([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [myRequests, setMyRequests] = useState<TaskApprovalRequestDto[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);
  const [rejectedRequests, setRejectedRequests] = useState(0);
  const [receivedTickets, setReceivedTickets] = useState<TicketDto[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [tasksRes, requestsRes] = await Promise.all([
        taskService.getAssignedToMe(0, 10),
        approvalService.getMyApprovalRequests(0, 50),
      ]);

      setAssignedTasks(tasksRes.content);
      setTotalAssigned(tasksRes.totalElements);

      const requests = requestsRes.content;
      setMyRequests(requests.slice(0, 10));
      setPendingRequests(requests.filter((r) => r.status === 'PENDING').length);
      setApprovedRequests(requests.filter((r) => r.status === 'APPROVED').length);
      setRejectedRequests(requests.filter((r) => r.status === 'REJECTED').length);
    } catch {
      // handled by global interceptor
    }

    try {
      const ticketsRes = await ticketService.getReceivedTickets(0, 10, true);
      setReceivedTickets(ticketsRes.content);
    } catch {
      setReceivedTickets([]);
    }

    try {
      const [notifs, notifCount] = await Promise.all([
        notificationService.getUnread(),
        notificationService.getUnreadCount(),
      ]);
      setRecentNotifications(notifs.slice(0, 10));
      setUnreadCount(notifCount);
    } catch {
      setRecentNotifications([]);
      setUnreadCount(0);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Atanan Görev', value: totalAssigned, icon: HiOutlineClipboardDocumentList, bg: 'bg-indigo-50', text: 'text-indigo-600', onClick: () => navigate('/tasks') },
    { label: 'Bekleyen Talep', value: pendingRequests, icon: HiOutlineClock, bg: 'bg-amber-50', text: 'text-amber-600', onClick: () => navigate('/my') },
    { label: 'Onaylanan Talep', value: approvedRequests, icon: HiOutlineCheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', onClick: () => navigate('/my') },
    { label: 'Reddedilen Talep', value: rejectedRequests, icon: HiOutlineXCircle, bg: 'bg-red-50', text: 'text-red-600', onClick: () => navigate('/my') },
    { label: 'Okunmamış Bildirim', value: unreadCount, icon: HiOutlineBell, bg: 'bg-rose-50', text: 'text-rose-600', onClick: () => navigate('/notifications') },
    { label: 'Gelen Ticket', value: receivedTickets.length, icon: HiOutlineTicket, bg: 'bg-purple-50', text: 'text-purple-600' },
  ];

  const typeLabels: Record<string, string> = { CREATE: 'Oluşturma', UPDATE: 'Güncelleme', COMPLETION: 'Tamamlama' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Atanan Görevlerim</h3>
            <button onClick={() => navigate('/tasks')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Tümünü Gör
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {assignedTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Henüz atanan görev yok</p>
            ) : (
              assignedTasks.map((task) => (
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

        {/* Right sidebar: Notifications + Request Results */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {recentNotifications.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-slate-400">Bildirim yok</p>
              ) : (
                recentNotifications.slice(0, 5).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (notif.referenceType === 'TASK' && notif.referenceId) navigate(`/tasks/${notif.referenceId}`);
                      else navigate('/notifications');
                    }}
                    className="w-full px-6 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${notif.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>{notif.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(notif.createdAt)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-100">
              <button onClick={() => navigate('/notifications')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Tümünü Gör
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Talep Sonuçlarım</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {myRequests.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-slate-400">Henüz talep yok</p>
              ) : (
                myRequests.slice(0, 5).map((req) => {
                  let parsed: { title?: string } = {};
                  try { parsed = JSON.parse(req.requestData); } catch { /* ignore */ }
                  return (
                    <div key={req.id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800 truncate flex-1 mr-2">
                          {parsed.title || `Talep #${req.id.slice(0, 8)}`}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getApprovalStatusColor(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {typeLabels[req.requestType] || req.requestType} &bull; {formatDate(req.createdAt)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-100">
              <button onClick={() => navigate('/my')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Tümünü Gör
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
