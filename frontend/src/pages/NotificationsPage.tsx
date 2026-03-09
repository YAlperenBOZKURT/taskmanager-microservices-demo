import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import { approvalService } from '../services/approvalService';
import type { NotificationDto, TaskApprovalRequestDto } from '../types';
import { formatDate, getApprovalStatusColor, getStatusLabel } from '../utils/helpers';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineInboxStack,
  HiOutlineEye,
} from 'react-icons/hi2';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuthStore();
  const canApprove = isSuperAdmin() || isAdmin();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [tab, setTab] = useState<'notifications' | 'approvals'>('notifications');

  // Approval requests for admins
  const [pendingApprovals, setPendingApprovals] = useState<TaskApprovalRequestDto[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsPage, setApprovalsPage] = useState(0);
  const [approvalsTotalPages, setApprovalsTotalPages] = useState(0);
  const [selectedApproval, setSelectedApproval] = useState<TaskApprovalRequestDto | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (tab === 'notifications') loadNotifications();
    else if (tab === 'approvals') loadApprovals();
  }, [page, filter, tab, approvalsPage]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (filter === 'UNREAD') {
        const unread = await notificationService.getUnread();
        setNotifications(unread);
        setTotalPages(1);
      } else {
        const res = await notificationService.getNotifications(page, 20);
        setNotifications(res.content);
        setTotalPages(res.totalPages);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const res = await approvalService.getPendingApprovals(approvalsPage, 20);
      setPendingApprovals(res.content);
      setApprovalsTotalPages(res.totalPages);
    } catch {
      // handled by interceptor
    } finally {
      setApprovalsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch {
      // handled by interceptor
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch {
      // handled by interceptor
    }
  };

  const handleClick = (notif: NotificationDto) => {
    if (!notif.read) handleMarkAsRead(notif.id);
    if (notif.referenceType === 'TASK' && notif.referenceId) {
      navigate(`/tasks/${notif.referenceId}`);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    setReviewing(true);
    try {
      await approvalService.reviewApproval(selectedApproval.id, status, reviewNote || undefined);
      setSelectedApproval(null);
      setReviewNote('');
      loadApprovals();
    } catch {
      // handled by interceptor
    } finally {
      setReviewing(false);
    }
  };

  const handleQuickApprove = async (approval: TaskApprovalRequestDto) => {
    try {
      await approvalService.reviewApproval(approval.id, 'APPROVED');
      loadApprovals();
    } catch {
      // handled by interceptor
    }
  };

  const handleQuickReject = async (approval: TaskApprovalRequestDto) => {
    try {
      await approvalService.reviewApproval(approval.id, 'REJECTED');
      loadApprovals();
    } catch {
      // handled by interceptor
    }
  };

  const parseRequestData = (data: string) => {
    try { return JSON.parse(data); } catch { return null; }
  };

  const typeLabels: Record<string, string> = { CREATE: 'Oluşturma', UPDATE: 'Güncelleme', COMPLETION: 'Tamamlama' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bildirimler</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin() ? 'Sistem bildirimleri' : isAdmin() ? 'Takım bildirimleri' : 'Bildirimleriniz'}
          </p>
        </div>
        {tab === 'notifications' && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <HiOutlineCheckCircle className="w-4 h-4" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setTab('notifications'); setPage(0); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Bildirimler
        </button>
        {canApprove && (
          <button
            onClick={() => { setTab('approvals'); setApprovalsPage(0); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'approvals'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Onay Talepleri
          </button>
        )}
        {tab === 'notifications' && (
          <>
            <button
              onClick={() => { setFilter('ALL'); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'ALL' && tab === 'notifications'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => { setFilter('UNREAD'); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'UNREAD'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Okunmamış
            </button>
          </>
        )}
      </div>

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <HiOutlineInboxStack className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Bildirim bulunamadı</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full px-6 py-4 flex items-start gap-4 text-left transition-colors hover:bg-slate-50 ${
                    !notif.read ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.read ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDate(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                      className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 flex-shrink-0"
                      title="Okundu işaretle"
                    >
                      <HiOutlineCheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}

          {filter === 'ALL' && totalPages > 1 && (
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
        </>
      )}

      {/* Approvals Tab (Admin/SuperAdmin only) */}
      {tab === 'approvals' && canApprove && (
        <>
          {approvalsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <HiOutlineCheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Bekleyen onay talebi yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((approval) => {
                const data = parseRequestData(approval.requestData);
                return (
                  <div
                    key={approval.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(approval.status)}`}>
                            {getStatusLabel(approval.status)}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                            {typeLabels[approval.requestType] || approval.requestType}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800">
                          {data?.title || `Talep #${approval.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {approval.requesterUsername} &bull; {formatDate(approval.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setSelectedApproval(approval); setReviewNote(''); }}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                          title="Detay"
                        >
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleQuickApprove(approval)}
                          className="p-2 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
                          title="Onayla"
                        >
                          <HiOutlineCheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleQuickReject(approval)}
                          className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                          title="Reddet"
                        >
                          <HiOutlineXCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {approvalsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setApprovalsPage((p) => Math.max(0, p - 1))}
                    disabled={approvalsPage === 0}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Önceki
                  </button>
                  <span className="text-sm text-slate-500">Sayfa {approvalsPage + 1} / {approvalsTotalPages}</span>
                  <button
                    onClick={() => setApprovalsPage((p) => Math.min(approvalsTotalPages - 1, p + 1))}
                    disabled={approvalsPage >= approvalsTotalPages - 1}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApproval(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Onay Talebi Detayı</h2>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Talep Eden</p>
                  <p className="text-sm font-medium text-slate-700">{selectedApproval.requesterUsername}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Talep Tipi</p>
                  <p className="text-sm font-medium text-slate-700">
                    {typeLabels[selectedApproval.requestType] || selectedApproval.requestType}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Durum</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(selectedApproval.status)}`}>
                    {getStatusLabel(selectedApproval.status)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Tarih</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(selectedApproval.createdAt)}</p>
                </div>
              </div>
              {selectedApproval.requestData && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Talep Verisi</p>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap break-all">
                    {JSON.stringify(parseRequestData(selectedApproval.requestData), null, 2)}
                  </pre>
                </div>
              )}
              {selectedApproval.status === 'PENDING' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">İnceleme Notu</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="İsteğe bağlı not ekleyin..."
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedApproval(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Kapat
              </button>
              {selectedApproval.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleReview('REJECTED')}
                    disabled={reviewing}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => handleReview('APPROVED')}
                    disabled={reviewing}
                    className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Onayla
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
