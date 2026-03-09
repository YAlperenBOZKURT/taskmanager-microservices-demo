import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { taskService } from '../services/taskService';
import { ticketService } from '../services/ticketService';
import { approvalService } from '../services/approvalService';
import type { TaskDto, TicketDto, TaskApprovalRequestDto } from '../types';
import {
  formatDate,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getApprovalStatusColor,
} from '../utils/helpers';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineTicket,
  HiOutlineClock,
} from 'react-icons/hi2';

export default function MyPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuthStore();
  const canApprove = isSuperAdmin() || isAdmin();

  const [activeTab, setActiveTab] = useState<'tasks' | 'tickets' | 'requests'>('tasks');
  const [myTasks, setMyTasks] = useState<TaskDto[]>([]);
  const [myTickets, setMyTickets] = useState<TicketDto[]>([]);
  const [myRequests, setMyRequests] = useState<TaskApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setPage(0);
    loadData();
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks') {
        const res = await taskService.getAssignedToMe(page, 20);
        setMyTasks(res.content);
        setTotalPages(res.totalPages);
      } else if (activeTab === 'tickets') {
        const res = await ticketService.getReceivedTickets(page, 20);
        setMyTickets(res.content);
        setTotalPages(res.totalPages);
      } else if (activeTab === 'requests') {
        const res = await approvalService.getMyApprovalRequests(page, 20);
        setMyRequests(res.content);
        setTotalPages(res.totalPages);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  // Admin/SuperAdmin can respond to tickets
  const handleApproveTicket = async (ticketId: string) => {
    try {
      await ticketService.approveTicket(ticketId);
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleRejectTicket = async (ticketId: string) => {
    try {
      await ticketService.rejectTicket(ticketId);
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const typeLabels: Record<string, string> = { CREATE: 'Oluşturma', UPDATE: 'Güncelleme', COMPLETION: 'Tamamlama' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sayfam</h1>
        <p className="text-sm text-slate-500 mt-1">Kişisel görevleriniz ve talepleriniz</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HiOutlineClipboardDocumentList className="w-4 h-4" />
          Görevlerim
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HiOutlineTicket className="w-4 h-4" />
          Ticket'larım
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HiOutlineClock className="w-4 h-4" />
          Taleplerim
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              {myTasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                  <HiOutlineClipboardDocumentList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Atanan görev yok</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {myTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1 mr-4">
                          <p className="text-sm font-medium text-slate-800">{task.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {task.team && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700">{task.team}</span>
                            )}
                            <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>
                          </div>
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
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <>
              {myTickets.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                  <HiOutlineTicket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Gelen ticket yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800">{ticket.title}</p>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {ticket.senderUsername} &bull; {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        {canApprove && ticket.status === 'PENDING' && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleApproveTicket(ticket.id)}
                              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleRejectTicket(ticket.id)}
                              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              Reddet
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <>
              {myRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                  <HiOutlineClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Henüz talep yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => {
                    let parsed: { title?: string } = {};
                    try { parsed = JSON.parse(req.requestData); } catch { /* ignore */ }
                    return (
                      <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(req.status)}`}>
                            {getStatusLabel(req.status)}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                            {typeLabels[req.requestType] || req.requestType}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800">
                          {parsed.title || `Talep #${req.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(req.createdAt)}</p>
                        {req.reviewNote && (
                          <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-slate-500">İnceleme notu: {req.reviewNote}</p>
                            {req.reviewedByUsername && (
                              <p className="text-xs text-slate-400 mt-1">İnceleyen: {req.reviewedByUsername}</p>
                            )}
                          </div>
                        )}
                        {req.taskId && (
                          <button
                            onClick={() => navigate(`/tasks/${req.taskId}`)}
                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Görevi Görüntüle
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Önceki
          </button>
          <span className="text-sm text-slate-500">Sayfa {page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
