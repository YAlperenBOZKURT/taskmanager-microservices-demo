// TaskManager Frontend - Users management page (admin only)
// Author: Yusuf Alperen Bozkurt

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/userService';
import type { User } from '../types';
import { Role } from '../types';
import { formatDate, getInitials, getRoleLabel, getHighestRole, getRoleBadgeColor } from '../utils/helpers';
import { HiOutlinePencilSquare, HiOutlineLockClosed, HiOutlineLockOpen } from 'react-icons/hi2';

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let res;
      // super admins see all users, admins see their team only
      if (isSuperAdmin()) {
        res = await userService.getAllUsers(page, 20);
      } else if (isAdmin() && currentUser?.team) {
        res = await userService.getUsersByTeam(currentUser.team, page, 20);
      } else {
        res = await userService.getAllUsers(page, 20);
      }
      setUsers(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentEnabled: boolean) => {
    try {
      await userService.toggleUserStatus(userId, !currentEnabled);
      loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditFullName(u.fullName || '');
    setEditEmail(u.email || '');
    setEditTeam(u.team || '');
    setEditRole(getHighestRole(u.roles));
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      // only super admins can edit user profiles and assign roles
      if (isSuperAdmin()) {
        await userService.updateUserProfile(selectedUser.id, {
          fullName: editFullName,
          email: editEmail,
          team: editTeam,
        });

        // map the selected role to the actual role array the backend expects
        const roleMap: Record<string, string[]> = {
          [Role.ROLE_SUPER_ADMIN]: [Role.ROLE_SUPER_ADMIN, Role.ROLE_ADMIN],
          [Role.ROLE_ADMIN]: [Role.ROLE_ADMIN],
          [Role.ROLE_USER]: [Role.ROLE_USER],
        };
        const newRoles = roleMap[editRole] || [Role.ROLE_USER];
        await userService.assignRoles(selectedUser.id, newRoles);
      }
      setEditMode(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin() && !isAdmin()) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Bu sayfaya erisim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kullanicilar</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isSuperAdmin() ? 'Tum kullanicilar' : 'Takim uyeleri'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="text-slate-500">Kullanici bulunamadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((u) => {
            const highestRole = getHighestRole(u.roles);
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {getInitials(u.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.fullName || u.username}</p>
                    <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleBadgeColor(highestRole)}`}>
                    {getRoleLabel(highestRole)}
                  </span>
                  {u.team && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-teal-50 text-teal-700">
                      {u.team}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {u.enabled ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {isSuperAdmin() && (
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Duzenle"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleStatus(u.id, u.enabled)}
                      className={`p-2 rounded-lg transition-colors ${u.enabled ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}
                      title={u.enabled ? 'Hesabi Dondur' : 'Hesabi Aktifle'}
                    >
                      {u.enabled ? <HiOutlineLockClosed className="w-4 h-4" /> : <HiOutlineLockOpen className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
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

      {/* Edit Modal */}
      {editMode && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditMode(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Kullanici Duzenle</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Takim</label>
                <input
                  type="text"
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="orn: Backend Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={Role.ROLE_SUPER_ADMIN}>Super Admin</option>
                  <option value={Role.ROLE_ADMIN}>Admin</option>
                  <option value={Role.ROLE_USER}>Kullanici</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Iptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
