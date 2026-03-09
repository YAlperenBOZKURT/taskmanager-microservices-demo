import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/userService';
import type { User } from '../types';
import { Role } from '../types';
import { formatDate, getInitials, getRoleLabel, getHighestRole, getRoleBadgeColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  HiOutlinePencilSquare,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineEnvelope,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newRole, setNewRole] = useState(Role.ROLE_USER);
  const [creating, setCreating] = useState(false);

  const isRegularUser = !isSuperAdmin() && !isAdmin();
  const userTeams = currentUser?.teams || [];

  useEffect(() => {
    loadUsers();
  }, [page, teamFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let res;
      if (isSuperAdmin()) {
        if (teamFilter !== 'ALL') {
          res = await userService.getUsersByTeamAdmin(teamFilter, page, 20);
        } else {
          res = await userService.getAllUsers(page, 20);
        }
      } else if (isAdmin()) {
        const teamToUse = teamFilter !== 'ALL' ? teamFilter : userTeams[0];
        if (teamToUse) {
          res = await userService.getUsersByTeamAdmin(teamToUse, page, 20);
        } else {
          res = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20, first: true, last: true };
        }
      } else {
        if (userTeams.length > 0) {
          const teamToUse = teamFilter !== 'ALL' ? teamFilter : userTeams[0];
          res = await userService.getTeamMembers(teamToUse, page, 20);
        } else {
          res = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20, first: true, last: true };
        }
      }
      setUsers(res.content);
      setTotalPages(res.totalPages);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentEnabled: boolean) => {
    try {
      await userService.toggleUserStatus(userId, !currentEnabled);
      toast.success(currentEnabled ? 'Hesap donduruldu' : 'Hesap aktifleştirildi');
      loadUsers();
    } catch { /* toast handled by interceptor */ }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await userService.deleteUser(userId);
      toast.success('Kullanıcı silindi');
      loadUsers();
    } catch { /* toast handled by interceptor */ }
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditFullName(u.fullName || '');
    setEditEmail(u.email || '');
    setEditTeam(u.teams ? u.teams.join(', ') : '');
    setEditRole(getHighestRole(u.roles));
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userService.updateUserProfile(selectedUser.id, {
        fullName: editFullName,
        email: editEmail,
      });

      if (isSuperAdmin()) {
        const teamsArray = editTeam.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
        await userService.setUserTeams(selectedUser.id, teamsArray);

        const roleMap: Record<string, string[]> = {
          [Role.ROLE_SUPER_ADMIN]: [Role.ROLE_SUPER_ADMIN],
          [Role.ROLE_ADMIN]: [Role.ROLE_ADMIN],
          [Role.ROLE_USER]: [Role.ROLE_USER],
        };
        await userService.assignRoles(selectedUser.id, roleMap[editRole] || [Role.ROLE_USER]);
      }

      toast.success('Kullanıcı güncellendi');
      setEditMode(false);
      setSelectedUser(null);
      loadUsers();
    } catch { /* toast handled by interceptor */ }
    finally { setSaving(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) return;
    setCreating(true);
    try {
      const teamsArray = newTeam.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      await userService.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        fullName: newFullName.trim() || undefined,
        teams: teamsArray.length > 0 ? teamsArray : undefined,
        roles: [newRole],
      });
      toast.success('Kullanıcı oluşturuldu');
      setShowCreateModal(false);
      setNewUsername(''); setNewEmail(''); setNewPassword('');
      setNewFullName(''); setNewTeam(''); setNewRole(Role.ROLE_USER);
      loadUsers();
    } catch { /* toast handled by interceptor */ }
    finally { setCreating(false); }
  };

  const canEdit = (u: User) => {
    if (isSuperAdmin()) return true;
    if (isAdmin()) {
      return !u.roles.includes(Role.ROLE_SUPER_ADMIN) && u.id !== currentUser?.id;
    }
    return false;
  };

  const canToggleStatus = (u: User) => {
    if (isSuperAdmin()) return true;
    if (isAdmin()) {
      return u.roles.includes(Role.ROLE_USER) && !u.roles.includes(Role.ROLE_ADMIN) && !u.roles.includes(Role.ROLE_SUPER_ADMIN);
    }
    return false;
  };

  const filterTeams = isSuperAdmin() ? [] : userTeams;

  const pageTitle = isSuperAdmin() ? 'Kullanıcı Yönetimi' : isAdmin() ? 'Takım Üyeleri' : 'Takım Arkadaşlarım';
  const pageDesc = isSuperAdmin()
    ? 'Tüm kullanıcıları yönetin, rol ve takım atamalarını düzenleyin'
    : isAdmin()
    ? 'Takımınızdaki üyeleri görüntüleyin ve yönetin'
    : 'Takım arkadaşlarınızı görüntüleyin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{pageDesc}</p>
        </div>
        <div className="flex items-center gap-3">
          {(filterTeams.length > 1 || isSuperAdmin()) && (
            <select
              value={teamFilter}
              onChange={(e) => { setTeamFilter(e.target.value); setPage(0); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">Tüm Takımlar</option>
              {filterTeams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          {isSuperAdmin() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Kullanıcı Oluştur
            </button>
          )}
        </div>
      </div>

      {/* User Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <HiOutlineEnvelope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Kullanıcı bulunamadı</p>
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
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                    highestRole === Role.ROLE_SUPER_ADMIN ? 'from-purple-500 to-indigo-600' :
                    highestRole === Role.ROLE_ADMIN ? 'from-blue-500 to-cyan-600' :
                    'from-indigo-400 to-purple-500'
                  } flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                    {getInitials(u.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.fullName || u.username}</p>
                    <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <HiOutlineEnvelope className="w-3 h-3" />
                      {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleBadgeColor(highestRole)}`}>
                    {getRoleLabel(highestRole)}
                  </span>
                  {u.teams && u.teams.length > 0 && u.teams.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium bg-teal-50 text-teal-700 flex items-center gap-1">
                      <HiOutlineBuildingOffice2 className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {u.enabled ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                {/* Action buttons - only visible for users with management permissions */}
                {(canEdit(u) || canToggleStatus(u)) && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      {canEdit(u) && (
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                          title="Düzenle"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                      )}
                      {isSuperAdmin() && u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Sil"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                      {canToggleStatus(u) && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.enabled)}
                          className={`p-2 rounded-lg transition-colors ${u.enabled ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}
                          title={u.enabled ? 'Hesabı Dondur' : 'Hesabı Aktifle'}
                        >
                          {u.enabled ? <HiOutlineLockClosed className="w-4 h-4" /> : <HiOutlineLockOpen className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Read-only footer for regular users */}
                {isRegularUser && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

      {/* Edit Modal */}
      {editMode && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditMode(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Kullanıcı Düzenle</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              {isSuperAdmin() && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Takımlar (virgülle ayırın)</label>
                    <input type="text" value={editTeam} onChange={(e) => setEditTeam(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="örn: Team A, Team B" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value={Role.ROLE_SUPER_ADMIN}>Super Admin</option>
                      <option value={Role.ROLE_ADMIN}>Admin</option>
                      <option value={Role.ROLE_USER}>Kullanıcı</option>
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditMode(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  İptal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal (Super Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Yeni Kullanıcı Oluştur</h2>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kullanıcı Adı</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="kullanici_adi" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="email@ornek.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Şifre</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Takımlar (virgülle ayırın)</label>
                <input type="text" value={newTeam} onChange={(e) => setNewTeam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="örn: Team A, Team B" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value={Role.ROLE_USER}>Kullanıcı</option>
                  <option value={Role.ROLE_ADMIN}>Admin</option>
                  <option value={Role.ROLE_SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
