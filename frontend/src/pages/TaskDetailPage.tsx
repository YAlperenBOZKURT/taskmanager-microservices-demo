import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineXMark,
  HiOutlineClock,
} from 'react-icons/hi2';
import { useAuthStore } from '../stores/authStore';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { approvalService } from '../services/approvalService';
import type { TaskDto, TaskApprovalRequestDto, AttachmentDto, TaskProgressEntryDto, User } from '../types';
import toast from 'react-hot-toast';
import {
  formatDate,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getApprovalStatusColor,
} from '../utils/helpers';

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [approvalHistory, setApprovalHistory] = useState<TaskApprovalRequestDto[]>([]);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editAssignees, setEditAssignees] = useState<string[]>([]);
  const [editTeamUsers, setEditTeamUsers] = useState<User[]>([]);
  const [loadingEditTeamUsers, setLoadingEditTeamUsers] = useState(false);
  const [allTeams, setAllTeams] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Progress entry
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Request modals (for USER role)
  const [showUpdateRequestModal, setShowUpdateRequestModal] = useState(false);
  const [showCompleteRequestModal, setShowCompleteRequestModal] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqPriority, setReqPriority] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  

  // Attachment upload
  const [uploading, setUploading] = useState(false);

  const canEdit = isSuperAdmin() || isAdmin();
  const isRegularUser = !isSuperAdmin() && !isAdmin();

  useEffect(() => {
    if (taskId) {
      loadTask();
      loadApprovalHistory();
    }
  }, [taskId]);

  useEffect(() => {
    userService.getAllTeams().then(setAllTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (editing && editTeam) {
      setLoadingEditTeamUsers(true);
      userService.getUsersByTeam(editTeam, 0, 100)
        .then((res) => setEditTeamUsers(res.content))
        .catch(() => setEditTeamUsers([]))
        .finally(() => setLoadingEditTeamUsers(false));
    } else if (editing) {
      setEditTeamUsers([]);
    }
  }, [editing, editTeam]);

  const loadTask = async () => {
    try {
      const data = await taskService.getTask(taskId!);
      setTask(data);
    } catch {
      setError('Görev bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalHistory = async () => {
    try {
      const res = isSuperAdmin() || isAdmin()
        ? await approvalService.getAllApprovals(0, 100)
        : await approvalService.getMyApprovalRequests(0, 100);
      const related = res.content.filter((a) => a.taskId === taskId);
      setApprovalHistory(related);
    } catch {
      // approval history might not be accessible
    }
  };

  const availableTeams = isSuperAdmin() ? allTeams : (user?.teams || []);

  const handleStartEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 16) : '');
    setEditTeam(task.team || '');
    setEditAssignees([...(task.assigneeIds || [])]);
    setEditErrors({});
    setEditing(true);
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editTeam) errors.team = 'Takım seçimi zorunludur';
    if (editAssignees.length === 0) errors.assignees = 'En az bir kişi atanmalıdır';
    if (!editTitle.trim()) errors.title = 'Başlık zorunludur';
    if (!editDesc.trim()) errors.description = 'Açıklama zorunludur';
    if (!editDueDate) {
      errors.dueDate = 'Son tarih zorunludur';
    } else if (new Date(editDueDate) < new Date()) {
      errors.dueDate = 'Son tarih geçmişte olamaz';
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!task) return;
    if (!validateEditForm()) return;
    setSaving(true);
    try {
      await taskService.updateTask(task.id, {
        title: editTitle,
        description: editDesc,
        team: editTeam,
        priority: editPriority,
        dueDate: editDueDate || undefined,
        assigneeIds: editAssignees,
      });
      toast.success('Görev güncellendi');
      setEditing(false);
      loadTask();
    } catch {
      // toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await taskService.deleteTask(task.id);
      toast.success('Görev silindi');
      navigate('/tasks');
    } catch {
      // toast handled by interceptor
    }
  };

  const handleMarkPending = async () => {
    if (!task) return;
    try {
      await taskService.markTaskPending(task.id);
      toast.success('Görev onay beklemeye alındı');
      loadTask();
    } catch {
      // toast handled by interceptor
    }
  };

  const handleApproveCompletion = async () => {
    if (!task) return;
    try {
      await taskService.approveCompletion(task.id);
      toast.success('Görev tamamlandı olarak onaylandı');
      loadTask();
    } catch {
      // toast handled by interceptor
    }
  };

  const handleAddProgress = async () => {
    if (!task || !progressMessage.trim()) return;
    setSubmittingProgress(true);
    try {
      await taskService.addProgressEntry(task.id, progressMessage.trim());
      toast.success('İlerleme güncellemesi eklendi');
      setProgressMessage('');
      setShowProgressModal(false);
      loadTask();
    } catch {
      // toast handled by interceptor
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleUpdateRequest = async () => {
    if (!task) return;
    setSubmittingRequest(true);
    try {
      await taskService.updateTask(task.id, {
        title: reqTitle || undefined,
        description: reqDesc || undefined,
        priority: reqPriority || undefined,
      });
      toast.success('Güncelleme talebiniz gönderildi. Onay bekleniyor.');
      setShowUpdateRequestModal(false);
      setReqTitle('');
      setReqDesc('');
      setReqPriority('');
      loadApprovalHistory();
    } catch {
      // toast handled by interceptor
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (!task) return;
    setSubmittingRequest(true);
    try {
      await taskService.completeTask(task.id, requestNote || undefined);
      toast.success('Tamamlama talebiniz gönderildi. Onay bekleniyor.');
      setShowCompleteRequestModal(false);
      setRequestNote('');
      loadApprovalHistory();
    } catch {
      // toast handled by interceptor
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.length) return;
    setUploading(true);
    try {
      await taskService.uploadAttachment(task.id, e.target.files[0]);
      toast.success('Dosya yüklendi');
      loadTask();
    } catch {
      // toast handled by interceptor
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    try {
      await taskService.deleteAttachment(attachmentId);
      toast.success('Dosya silindi');
      loadTask();
    } catch {
      // toast handled by interceptor
    }
  };

  const toggleEditAssignee = (userId: string) => {
    setEditAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">{error || 'Görev bulunamadı'}</p>
        <button onClick={() => navigate('/tasks')} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
          Görevlere Dön
        </button>
      </div>
    );
  }

  const typeLabels: Record<string, string> = { CREATE: 'Oluşturma', UPDATE: 'Güncelleme', COMPLETION: 'Tamamlama' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/tasks')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Görevlere Dön
      </button>

      {/* Task Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        {editing ? (
          /* Edit Mode */
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Görevi Düzenle</h2>
              <button onClick={() => setEditing(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <HiOutlineXMark className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Takım *</label>
              <select
                value={editTeam}
                onChange={(e) => { setEditTeam(e.target.value); setEditAssignees([]); }}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${editErrors.team ? 'border-red-300' : 'border-slate-200'}`}
              >
                <option value="">Takım Seçin</option>
                {availableTeams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {editErrors.team && <p className="text-xs text-red-500 mt-1">{editErrors.team}</p>}
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Atanan Kişiler *</label>
              {!editTeam ? (
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
                  Önce bir takım seçin
                </div>
              ) : loadingEditTeamUsers ? (
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                  Yükleniyor...
                </div>
              ) : editTeamUsers.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                  Bu takımda kullanıcı bulunamadı
                </div>
              ) : (
                <div className={`rounded-xl border bg-slate-50 max-h-40 overflow-y-auto ${editErrors.assignees ? 'border-red-300' : 'border-slate-200'}`}>
                  {editTeamUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={editAssignees.includes(u.id)}
                        onChange={() => toggleEditAssignee(u.id)}
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
              {editAssignees.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">{editAssignees.length} kişi seçildi</p>
              )}
              {editErrors.assignees && <p className="text-xs text-red-500 mt-1">{editErrors.assignees}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Başlık *</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${editErrors.title ? 'border-red-300' : 'border-slate-200'}`}
              />
              {editErrors.title && <p className="text-xs text-red-500 mt-1">{editErrors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama *</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${editErrors.description ? 'border-red-300' : 'border-slate-200'}`}
              />
              {editErrors.description && <p className="text-xs text-red-500 mt-1">{editErrors.description}</p>}
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Öncelik *</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
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
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${editErrors.dueDate ? 'border-red-300' : 'border-slate-200'}`}
                />
                {editErrors.dueDate && <p className="text-xs text-red-500 mt-1">{editErrors.dueDate}</p>}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            <div className="flex flex-wrap items-start gap-3 mb-6">
              <h1 className="text-2xl font-bold text-slate-800 flex-1">{task.title}</h1>
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            {task.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Açıklama</h3>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <HiOutlineBuildingOffice2 className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Takım</p>
                  <p className="text-sm font-medium text-slate-700">{task.team || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <HiOutlineUser className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Oluşturan</p>
                  <p className="text-sm font-medium text-slate-700">{task.creatorId?.slice(0, 8) || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <HiOutlineUserGroup className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Atanan Kişi</p>
                  <p className="text-sm font-medium text-slate-700">{task.assigneeIds?.length || 0} kişi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <HiOutlineCalendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Oluşturulma</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(task.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <HiOutlineCalendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Son Tarih</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(task.dueDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <HiOutlineTag className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Son Güncelleme</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(task.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {canEdit && (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                    Düzenle
                  </button>
                  {task.status === 'ACTIVE' && (
                    <button
                      onClick={handleMarkPending}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      <HiOutlineClock className="w-4 h-4" />
                      Tamamlandı Olarak İşaretle
                    </button>
                  )}
                  {task.status === 'PENDING' && (
                    <button
                      onClick={handleApproveCompletion}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Onayla
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    Sil
                  </button>
                </>
              )}

              {isRegularUser && task.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => {
                      setReqTitle(task.title);
                      setReqDesc(task.description || '');
                      setReqPriority(task.priority);
                      setShowUpdateRequestModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                    Güncelleme Talebi
                  </button>
                  <button
                    onClick={() => setShowCompleteRequestModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Tamamlama Talebi
                  </button>
                </>
              )}

              {/* + Ekleme Yap (progress entry) - all roles with access */}
              {(canEdit || !isRegularUser || true) && task.status !== 'COMPLETED' && (
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors"
                >
                  <HiOutlinePlusCircle className="w-4 h-4" />
                  + Ekleme Yap
                </button>
              )}

              {/* File upload */}
              {(isSuperAdmin() || canEdit) && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <HiOutlineArrowUpTray className="w-4 h-4" />
                    {uploading ? 'Yükleniyor...' : 'Dosya Ekle'}
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Progress Entries */}
      {task.progressEntries && task.progressEntries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <HiOutlinePlusCircle className="w-5 h-5 text-slate-400" />
              İlerleme Güncellemeleri ({task.progressEntries.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
              <div className="space-y-4">
                {task.progressEntries.map((entry: TaskProgressEntryDto) => (
                  <div key={entry.id} className="relative flex gap-4 pl-10">
                    <div className="absolute left-2.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                    <div className="flex-1 bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {entry.createdByUsername} &bull; {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <HiOutlinePaperClip className="w-5 h-5 text-slate-400" />
              Dosyalar ({task.attachments.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {task.attachments.map((att: AttachmentDto) => (
              <div key={att.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <HiOutlinePaperClip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{att.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {(att.fileSize / 1024).toFixed(1)} KB &bull; {formatDate(att.createdAt)}
                    </p>
                  </div>
                </div>
                {(canEdit || att.uploadedBy === user?.id) && (
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors flex-shrink-0"
                    title="Sil"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {approvalHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Aktivite Geçmişi</h3>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
              <div className="space-y-6">
                {approvalHistory.map((item) => {
                  let parsed: { title?: string; description?: string } = {};
                  try { parsed = JSON.parse(item.requestData); } catch { /* ignore */ }
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-500',
                    APPROVED: 'bg-green-500',
                    REJECTED: 'bg-red-500',
                  };
                  return (
                    <div key={item.id} className="relative flex gap-4 pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-slate-300'} ring-4 ring-white`} />
                      <div className="flex-1 bg-slate-50 rounded-xl p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                            {typeLabels[item.requestType] || item.requestType}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800">
                          {parsed.title || `Talep #${item.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.requesterUsername} &bull; {formatDate(item.createdAt)}
                        </p>
                        {item.reviewNote && (
                          <p className="text-xs text-slate-500 mt-2 bg-white rounded-lg px-3 py-2">
                            İnceleme notu: {item.reviewNote}
                          </p>
                        )}
                        {item.reviewedByUsername && (
                          <p className="text-xs text-slate-400 mt-1">
                            İnceleyen: {item.reviewedByUsername} &bull; {formatDate(item.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Entry Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowProgressModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">+ Ekleme Yap</h2>
              <button onClick={() => setShowProgressModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <HiOutlineXMark className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Görev ile ilgili ilerleme güncellemesi ekleyin. Bu, mevcut açıklamanın üzerine yazmaz.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Güncelleme Mesajı</label>
                <textarea
                  value={progressMessage}
                  onChange={(e) => setProgressMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="İlerleme notunuzu yazın..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddProgress}
                  disabled={submittingProgress || !progressMessage.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submittingProgress ? 'Kaydediliyor...' : 'Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Request Modal (USER) */}
      {showUpdateRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpdateRequestModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Güncelleme Talebi</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Başlık</label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama</label>
                <textarea
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Öncelik</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="CRITICAL">Kritik</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowUpdateRequestModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateRequest}
                  disabled={submittingRequest}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submittingRequest ? 'Gönderiliyor...' : 'Talep Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Request Modal (USER) */}
      {showCompleteRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompleteRequestModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Tamamlama Talebi</h2>
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Bu görevin tamamlandığını bildirmek istiyorsunuz. Yöneticiniz talebi inceleyecektir.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Not (isteğe bağlı)</label>
                <textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Tamamlama notu ekleyin..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCompleteRequestModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCompleteRequest}
                  disabled={submittingRequest}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {submittingRequest ? 'Gönderiliyor...' : 'Talep Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
