// TaskManager Frontend - Approvals page for reviewing task approval requests
// Author: Yusuf Alperen Bozkurt

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { approvalService } from '../services/approvalService';
import type { TaskApprovalRequestDto } from '../types';
import { formatDate, getApprovalStatusColor, getStatusLabel } from '../utils/helpers';
import { HiOutlineEye, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

export default function ApprovalsPage() {
  const { isSuperAdmin, isAdmin } = useAuthStore();
  const [approvals, setApprovals] = useState<TaskApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<TaskApprovalRequestDto | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    // reload approvals whenever the page or filter changes
    loadApprovals();
  }, [page, filter]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = filter === 'PENDING'
        ? await approvalService.getPendingApprovals(page, 20)
        : await approvalService.getAllApprovals(page, 20);

      // filter approvals based on the selected status
      let filtered = res.content;
      if (filter === 'APPROVED') filtered = filtered.filter((a) => a.status === 'APPROVED');
      if (filter === 'REJECTED') filtered = filtered.filter((a) => a.status === 'REJECTED');

      setApprovals(filtered);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error loading approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    setReviewing(true);
    try {
      // send the review decision to the backend
      await approvalService.reviewApproval(selectedApproval.id, status, reviewNote || undefined);
      // close the modal after submitting
      setSelectedApproval(null);
      setReviewNote('');
      loadApprovals();
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setReviewing(false);
    }
  };

  const parseRequestData = (data: string) => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const filters = [
    { key: 'ALL' as const, label: 'Tümü' },
    { key: 'PENDING' as const, label: 'Beklemede' },
    { key: 'APPROVED' as const, label: 'Onaylandı' },
    { key: 'REJECTED' as const, label: 'Reddedildi' },
  ];

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'CREATE': return 'Oluşturma';
      case 'UPDATE': return 'Güncelleme';
      case 'DELETE': return 'Silme';
      case 'ASSIGN': return 'Atama';
      default: return type;
    }
  };

  // only admins and super admins can access this page
  if (!isSuperAdmin() && !isAdmin()) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Onay Talepleri</h1>
        <p className="text-sm text-slate-500 mt-1">Kullanıcılardan gelen görev onay talepleri</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(0); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="text-slate-500">Onay talebi bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const data = parseRequestData(approval.requestData);
            return (
              <div
                key={approval.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(approval.status)}`}>
                        {getStatusLabel(approval.status)}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                        {getRequestTypeLabel(approval.requestType)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      {data?.title || `Talep #${approval.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {approval.requesterUsername} • {formatDate(approval.createdAt)}
                    </p>
                    {approval.reviewNote && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 px-3 py-2 rounded-lg">
                        Not: {approval.reviewNote}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedApproval(approval); setReviewNote(''); }}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                      title="Detay"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </button>
                    {approval.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => { setSelectedApproval(approval); setReviewNote(''); }}
                          className="p-2 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
                          title="Onayla"
                        >
                          <HiOutlineCheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setSelectedApproval(approval); setReviewNote(''); }}
                          className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                          title="Reddet"
                        >
                          <HiOutlineXCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
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
      )}

      {/* Review Modal */}
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
                  <p className="text-sm font-medium text-slate-700">{getRequestTypeLabel(selectedApproval.requestType)}</p>
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

              {/* Request Data */}
              {selectedApproval.requestData && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Talep Verisi</p>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap break-all">
                    {JSON.stringify(parseRequestData(selectedApproval.requestData), null, 2)}
                  </pre>
                </div>
              )}

              {/* Review Note */}
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
