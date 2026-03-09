import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import type { User, TaskDto } from '../types';
import { Role } from '../types';
import { formatDate, getInitials, getRoleLabel, getHighestRole, getRoleBadgeColor, getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel } from '../utils/helpers';
import {
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
} from 'react-icons/hi2';

interface TeamData {
  name: string;
  users: User[];
  admins: User[];
}

export default function TeamsPage() {
  const { user: currentUser, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<TeamData[]>([]);
  const [allTeamNames, setAllTeamNames] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [teamTasks, setTeamTasks] = useState<TaskDto[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('members');

  const userTeams = currentUser?.teams || [];

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam && activeTab === 'tasks') {
      loadTeamTasks(selectedTeam);
    }
  }, [selectedTeam, activeTab]);

  const loadTeams = async () => {
    try {
      let usersRes;
      if (isSuperAdmin()) {
        usersRes = await userService.getAllUsers(0, 200);
      } else if (userTeams.length > 0) {
        const allUsers: User[] = [];
        for (const team of userTeams) {
          const res = await userService.getTeamMembers(team, 0, 100);
          allUsers.push(...res.content);
        }
        const unique = allUsers.filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i);
        usersRes = { content: unique };
      } else {
        usersRes = { content: [] };
      }

      const teamMap = new Map<string, { users: User[]; admins: User[] }>();

      usersRes.content.forEach((u: User) => {
        if (u.teams) {
          u.teams.forEach((t) => {
            if (!teamMap.has(t)) teamMap.set(t, { users: [], admins: [] });
            const info = teamMap.get(t)!;
            if (u.roles.includes(Role.ROLE_ADMIN) || u.roles.includes(Role.ROLE_SUPER_ADMIN)) {
              if (!info.admins.find((a) => a.id === u.id)) info.admins.push(u);
            }
            if (u.roles.includes(Role.ROLE_USER)) {
              if (!info.users.find((a) => a.id === u.id)) info.users.push(u);
            }
          });
        }
      });

      const teamList = Array.from(teamMap.entries()).map(([name, info]) => ({
        name,
        users: info.users,
        admins: info.admins,
      }));

      if (!isSuperAdmin()) {
        const filteredTeams = teamList.filter((t) => userTeams.includes(t.name));
        setTeams(filteredTeams);
        setAllTeamNames(filteredTeams.map((t) => t.name));
        if (filteredTeams.length > 0 && !selectedTeam) setSelectedTeam(filteredTeams[0].name);
      } else {
        setTeams(teamList);
        setAllTeamNames(teamList.map((t) => t.name));
        if (teamList.length > 0 && !selectedTeam) setSelectedTeam(teamList[0].name);
      }
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamTasks = async (teamName: string) => {
    try {
      const res = await taskService.getTasks(0, 50);
      setTeamTasks(res.content.filter((t) => t.team === teamName));
    } catch {
      setTeamTasks([]);
    }
  };

  const currentTeam = teams.find((t) => t.name === selectedTeam);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Takımlar</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin() ? 'Tüm takımları yönetin' : 'Takımlarınız ve üyeler'}
          </p>
        </div>
        {allTeamNames.length > 1 && (
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {allTeamNames.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((team) => (
          <button
            key={team.name}
            onClick={() => setSelectedTeam(team.name)}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-200 text-left ${
              selectedTeam === team.name ? 'border-indigo-300 shadow-md ring-1 ring-indigo-200' : 'border-slate-100 hover:shadow-md hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{team.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <HiOutlineUserGroup className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{team.users.length} kullanıcı</span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineUserGroup className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-600">{team.admins.length} admin</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Team Detail */}
      {currentTeam && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-indigo-500" />
              {currentTeam.name}
              <span className="text-xs text-slate-400 font-normal ml-2">
                {currentTeam.admins.length + currentTeam.users.length} üye
              </span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'members' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Üyeler
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Görevler
              </button>
            </div>
          </div>

          {activeTab === 'members' && (
            <div className="p-6">
              {currentTeam.admins.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-3">Adminler</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentTeam.admins.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {getInitials(u.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{u.fullName || u.username}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(getHighestRole(u.roles))}`}>
                          {getRoleLabel(getHighestRole(u.roles))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentTeam.users.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-3">Kullanıcılar</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentTeam.users.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {getInitials(u.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{u.fullName || u.username}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentTeam.admins.length === 0 && currentTeam.users.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">Bu takımda üye yok</p>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="divide-y divide-slate-50">
              {teamTasks.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">Bu takıma ait görev yok</p>
              ) : (
                teamTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(task.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
