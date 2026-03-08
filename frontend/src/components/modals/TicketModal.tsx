// TaskManager Frontend - Ticket creation modal for sending support tickets
// Author: Yusuf Alperen Bozkurt

import { useState, useEffect } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import { Role } from '../../types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketModal({ isOpen, onClose }: TicketModalProps) {
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // reset the form every time the modal opens
      loadRecipients();
      setTitle('');
      setContent('');
      setRecipientId('');
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const loadRecipients = async () => {
    try {
      // fetch all users and filter based on who the current user can send tickets to
      const res = await userService.getAllUsers(0, 100);
      let filtered = res.content;

      if (isAdmin() && !isSuperAdmin()) {
        // Admin can send to super admins
        filtered = filtered.filter((u: User) =>
          u.roles.includes(Role.ROLE_SUPER_ADMIN) && u.id !== user?.id
        );
      } else if (!isAdmin()) {
        // User can send to admins and super admins
        filtered = filtered.filter((u: User) =>
          (u.roles.includes(Role.ROLE_ADMIN) || u.roles.includes(Role.ROLE_SUPER_ADMIN)) && u.id !== user?.id
        );
      }
      setRecipients(filtered);
      if (filtered.length > 0) setRecipientId(filtered[0].id);
    } catch {
      // Users might not have admin access, try without
      setRecipients([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !recipientId) return;

    setLoading(true);
    setError('');
    try {
      await ticketService.createTicket({
        recipientId,
        title: title.trim(),
        content: content.trim(),
      });
      setSuccess(true);
      // auto-close the modal after a short delay
      setTimeout(() => onClose(), 1500);
    } catch {
      setError('Ticket gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 animate-in fade-in zoom-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Ticket Oluştur</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-800">Ticket gönderildi!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Alıcı</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Seçiniz...</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName || r.username} ({r.roles.includes(Role.ROLE_SUPER_ADMIN) ? 'Super Admin' : 'Admin'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Ticket başlığı"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">İçerik</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                placeholder="Ticket içeriğini yazın..."
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
