// TaskManager Frontend - User profile page with edit and password change
// Author: Yusuf Alperen Bozkurt

import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { getInitials, getRoleLabel, getHighestRole } from '../utils/helpers';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // password change form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await authService.updateMyProfile({ fullName, email });
      setUser(updated);
      setEditing(false);
      setMessage('Profil guncellendi');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Guncelleme basarisiz');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // make sure passwords match before sending
    if (newPassword !== confirmPassword) {
      setPwMessage('Sifreler eslesmiyor');
      return;
    }
    setPwLoading(true);
    setPwMessage('');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwMessage('Sifre degistirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setPwMessage(''), 3000);
    } catch {
      setPwMessage('Sifre degistirme basarisiz');
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  const highestRole = getHighestRole(user.roles);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {getInitials(user.fullName)}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800">{user.fullName || user.username}</h1>
            <p className="text-slate-500">@{user.username}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700">
                {getRoleLabel(highestRole)}
              </span>
              {user.team && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-teal-50 text-teal-700">
                  {user.team}
                </span>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.includes('basarisiz') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        {editing ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Iptal
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Kullanici Adi</p>
                <p className="text-sm font-medium text-slate-700">@{user.username}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Email</p>
                <p className="text-sm font-medium text-slate-700">{user.email}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Ad Soyad</p>
                <p className="text-sm font-medium text-slate-700">{user.fullName || '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Takim</p>
                <p className="text-sm font-medium text-slate-700">{user.team || '-'}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Profili Duzenle
            </button>
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Sifre Degistir</h2>

        {pwMessage && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${pwMessage.includes('basarisiz') || pwMessage.includes('eslesmiyor') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {pwMessage}
          </div>
        )}

        {showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mevcut Sifre</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Yeni Sifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Yeni Sifre (Tekrar)</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="submit"
                disabled={pwLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {pwLoading ? 'Degistiriliyor...' : 'Sifre Degistir'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sifreyi Degistir
          </button>
        )}
      </div>
    </div>
  );
}
