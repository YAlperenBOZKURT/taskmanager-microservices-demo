// TaskManager Frontend - Task detail page showing full task info
// Author: Yusuf Alperen Bozkurt

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineTag, HiOutlineUser } from 'react-icons/hi2';
import { taskService } from '../services/taskService';
import type { TaskDto } from '../types';
import { formatDate, getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel } from '../utils/helpers';

export default function TaskDetailPage() {
  // grab the taskId from the URL params
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      // fetch the task details from the backend
      const data = await taskService.getTask(taskId!);
      setTask(data);
    } catch {
      setError('Görev bulunamadı');
    } finally {
      setLoading(false);
    }
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
        <button
          onClick={() => navigate('/tasks')}
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          Görevlere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <HiOutlineUser className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Atanan Kişi Sayısı</p>
              <p className="text-sm font-medium text-slate-700">{task.assigneeIds?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <HiOutlineTag className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Güncelleme</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(task.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Dosyalar</h3>
            <div className="space-y-2">
              {task.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-700">{att.fileName}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {/* convert bytes to KB for display */}
                    {(att.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
