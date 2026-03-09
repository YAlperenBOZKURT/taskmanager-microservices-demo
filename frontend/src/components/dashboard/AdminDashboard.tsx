import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineClock,
  HiOutlineDocumentPlus,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineTicket,
  HiOutlineBell,
} from 'react-icons/hi2';
import { approvalService } from '../../services/approvalService';
import { ticketService } from '../../services/ticketService';
import { notificationService } from '../../services/notificationService';
import type { TaskApprovalRequestDto, TicketDto, NotificationDto } from '../../types';
import { formatDate, getApprovalStatusColor, getStatusLabel } from '../../utils/helpers';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [pendingApprovals, setPendingApprovals] = useState<TaskApprovalRequestDto[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [createRequests, setCreateRequests] = useState(0);
  const [updateRequests, setUpdateRequests] = useState(0);
  const [completionRequests, setCompletionRequests] = useState(0);
  const [recentTickets, setRecentTickets] = useState<TicketDto[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const approvalsRes = await approvalService.getPendingApprovals(0, 50);
      const pending = approvalsRes.content;
      setPendingApprovals(pending.slice(0, 10));
      setPendingCount(approvalsRes.totalElements);
      setCreateRequests(pending.filter((a) => a.requestType === 'CREATE').length);
      setUpdateRequests(pending.filter((a) => a.requestType === 'UPDATE').length);
      setCompletionRequests(pending.filter((a) => a.requestType === 'COMPLETION').length);
    } catch {
      // handled by global interceptor
    }

    try {
      const ticketsRes = await ticketService.getReceivedTickets(0, 10, true);
      setRecentTickets(ticketsRes.content);
    } catch {
      setRecentTickets([]);
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
    { label: 'Onay Bekleyen', value: pendingCount, icon: HiOutlineClock, bg: 'bg-amber-50', text: 'text-amber-600', onClick: () => navigate('/approvals') },
    { label: 'Oluşturma Talebi', value: createRequests, icon: HiOutlineDocumentPlus, bg: 'bg-blue-50', text: 'text-blue-600', onClick: () => navigate('/approvals') },
    { label: 'Güncelleme Talebi', value: updateRequests, icon: HiOutlinePencilSquare, bg: 'bg-purple-50', text: 'text-purple-600', onClick: () => navigate('/approvals') },
    { label: 'Tamamlama Talebi', value: completionRequests, icon: HiOutlineCheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', onClick: () => navigate('/approvals') },
    { label: 'Okunmamış Bildirim', value: unreadCount, icon: HiOutlineBell, bg: 'bg-rose-50', text: 'text-rose-600', onClick: () => navigate('/notifications') },
    { label: 'Takım Ticket', value: recentTickets.length, icon: HiOutlineTicket, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  ];

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
        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Onay Bekleyen Talepler</h3>
            <button onClick={() => navigate('/approvals')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Tümünü Gör
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingApprovals.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Bekleyen talep yok</p>
            ) : (
              pendingApprovals.map((approval) => {
                const typeLabels: Record<string, string> = { CREATE: 'Oluşturma', UPDATE: 'Güncelleme', COMPLETION: 'Tamamlama' };
                let parsed: { title?: string } = {};
                try { parsed = JSON.parse(approval.requestData); } catch { /* ignore */ }
                return (
                  <button
                    key={approval.id}
                    onClick={() => navigate('/approvals')}
                    className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {parsed.title || `Talep #${approval.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {approval.requesterUsername} &bull; {formatDate(approval.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                        {typeLabels[approval.requestType] || approval.requestType}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(approval.status)}`}>
                        {getStatusLabel(approval.status)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Notifications + Tickets */}
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
              <h3 className="font-semibold text-slate-800">Takım Ticket'ları</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {recentTickets.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-slate-400">Ticket yok</p>
              ) : (
                recentTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-800 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ticket.senderUsername} &bull; {formatDate(ticket.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
