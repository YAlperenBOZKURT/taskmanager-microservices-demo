import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import type { TaskDto, User } from '../types';
import { formatDate, getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineFunnel, HiOutlineXMark } from 'react-icons/hi2';

export default function TasksPage() {
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [loadingTeamUsers, setLoadingTeamUsers] = useState(false);
  const [allTeams, setAllTeams] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isRegularUser = !isSuperAdmin() && !isAdmin();

  useEffect(() => {
    loadTasks();
  }, [page, statusFilter, teamFilter]);

  useEffect(() => {
    userService.getAllTeams().then(setAllTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (newTeam) {
      setLoadingTeamUsers(true);
      userService.getUsersByTeam(newTeam, 0, 100)
        .then((res) => setTeamUsers(res.content))
        .catch(() => setTeamUsers([]))
        .finally(() => setLoadingTeamUsers(false));
    } else {
      setTeamUsers([]);
      setNewAssignees([]);
    }
  }, [newTeam]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let res;
      if (statusFilter !== 'ALL') {
        res = await taskService.getTasksByStatus(statusFilter, page, 20);
      } else if (isSuperAdmin()) {
        res = await taskService.getTasks(page, 20);
      } else if (isAdmin()) {
        res = await taskService.getTasks(page, 20);
      } else {
        res = await taskService.getAssignedToMe(page, 20);
      }

      let filtered = res.content;
      if (teamFilter !== 'ALL') {
        filtered = filtered.filter((t) => t.team === teamFilter);
      }

      setTasks(filtered);
      setTotalPages(res.totalPages);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newTeam) errors.team = 'Takım seçimi zorunludur';
    if (newAssignees.length === 0) errors.assignees = 'En az bir kişi atanmalıdır';
    if (!newTitle.trim()) errors.title = 'Başlık zorunludur';
    if (!newDesc.trim()) errors.description = 'Açıklama zorunludur';
    if (!newDueDate) {
      errors.dueDate = 'Son tarih zorunludur';
    } else if (new Date(newDueDate) < new Date()) {
      errors.dueDate = 'Son tarih geçmişte olamaz';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setCreating(true);
    try {
      await taskService.createTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        dueDate: newDueDate || undefined,
        team: newTeam || undefined,
        assigneeIds: newAssignees,
      });

      if (isRegularUser) {
        toast.success('Görev oluşturma talebiniz gönderildi. Yönetici onayı bekleniyor.');
      } else {
        toast.success('Görev başarıyla oluşturuldu.');
      }

      setShowCreateModal(false);
      resetCreateForm();
      loadTasks();
    } catch {
      // toast handled by api interceptor
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewPriority('MEDIUM');
    setNewDueDate('');
    setNewTeam('');
    setNewAssignees([]);
    setTeamUsers([]);
    setValidationErrors({});
  };

  const toggleAssignee = (userId: string) => {
    setNewAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const availableTeams = isSuperAdmin() ? allTeams : (user?.teams || []);
  const statuses = ['ALL', 'ACTIVE', 'PENDING', 'COMPLETED'];
  const statusLabels: Record<string, string> = {
    ALL: 'Tümü',
    ACTIVE: 'Active',
    PENDING: 'Pending Approval',
    COMPLETED: 'Onaylandı',
  };

  const userTeams = user?.teams || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Görevler</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin() ? 'Tüm görevler' : isAdmin() ? 'Takım görevleri' : 'Atanan görevlerim'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <HiOutlinePlus className="w-4 h-4" />
          {isRegularUser ? 'Görev Talebi Oluştur' : 'Yeni Görev'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {userTeams.length > 1 && (
          <select
            value={teamFilter}
            onChange={(e) => { setTeamFilter(e.target.value); setPage(0); }}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">Tüm Takımlar</option>
            {userTeams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <HiOutlineFunnel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Görev bulunamadı</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Başlık</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Takım</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Öncelik</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Durum</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Son Tarih</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Oluşturulma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
                      <div className="flex gap-2 mt-2 md:hidden">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-teal-50 text-teal-700">
                        {task.team || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {formatDate(task.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Önceki
              </button>
              <span className="text-sm text-slate-500">
                Sayfa {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {isRegularUser ? 'Görev Oluşturma Talebi' : 'Yeni Görev Oluştur'}
              </h2>
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <HiOutlineXMark className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {isRegularUser && (
              <p className="text-sm text-slate-500 mb-6">
                Talebiniz yöneticinize iletilecek ve onay sonrası görev oluşturulacaktır.
              </p>
            )}
            <form onSubmit={handleCreateTask} className="space-y-5">
              {/* Team Selection (First) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Takım *</label>
                <select
                  value={newTeam}
                  onChange={(e) => { setNewTeam(e.target.value); setNewAssignees([]); }}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.team ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">Takım Seçin</option>
                  {availableTeams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {validationErrors.team && <p className="text-xs text-red-500 mt-1">{validationErrors.team}</p>}
              </div>

              {/* Assignee Selection (Depends on Team) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Atanan Kişiler *</label>
                {!newTeam ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
                    Önce bir takım seçin
                  </div>
                ) : loadingTeamUsers ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                    Yükleniyor...
                  </div>
                ) : teamUsers.length === 0 ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                    Bu takımda kullanıcı bulunamadı
                  </div>
                ) : (
                  <div className={`rounded-xl border bg-slate-50 max-h-40 overflow-y-auto ${validationErrors.assignees ? 'border-red-300' : 'border-slate-200'}`}>
                    {teamUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={newAssignees.includes(u.id)}
                          onChange={() => toggleAssignee(u.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{u.fullName || u.username}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {newAssignees.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">{newAssignees.length} kişi seçildi</p>
                )}
                {validationErrors.assignees && <p className="text-xs text-red-500 mt-1">{validationErrors.assignees}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Başlık *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.title ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Görev başlığı"
                />
                {validationErrors.title && <p className="text-xs text-red-500 mt-1">{validationErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama *</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${validationErrors.description ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Görev açıklaması"
                />
                {validationErrors.description && <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>}
              </div>

              {/* Priority + Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Öncelik *</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="LOW">Düşük</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="HIGH">Yüksek</option>
                    <option value="CRITICAL">Kritik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Son Tarih *</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.dueDate ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {validationErrors.dueDate && <p className="text-xs text-red-500 mt-1">{validationErrors.dueDate}</p>}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Gönderiliyor...' : isRegularUser ? 'Talep Gönder' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
