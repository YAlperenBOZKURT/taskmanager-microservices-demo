// TaskManager Frontend - Notifications page with read/unread filtering
// Author: Yusuf Alperen Bozkurt

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import type { NotificationDto } from '../types';
import { formatDate } from '../utils/helpers';
import { HiOutlineCheckCircle, HiOutlineInboxStack } from 'react-icons/hi2';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

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
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleClick = (notif: NotificationDto) => {
    // mark as read if it hasn't been read yet
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    // navigate to the task if the notification references one
    if (notif.referenceType === 'TASK' && notif.referenceId) {
      navigate(`/tasks/${notif.referenceId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bildirimler</h1>
          <p className="text-sm text-slate-500 mt-1">Tum bildirimleriniz</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <HiOutlineCheckCircle className="w-4 h-4" />
          Tumunu Okundu Isaretle
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => { setFilter('ALL'); setPage(0); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tumunu
        </button>
        <button
          onClick={() => { setFilter('UNREAD'); setPage(0); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'UNREAD'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Okunmamis
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <HiOutlineInboxStack className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Bildirim bulunamadi</p>
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
                  title="Okundu isaretle"
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
            Onceki
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
