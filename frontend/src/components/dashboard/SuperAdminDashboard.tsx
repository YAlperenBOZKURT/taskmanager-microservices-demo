import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineTicket,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';
import { ticketService } from '../../services/ticketService';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';
import type { TicketDto, NotificationDto, User } from '../../types';
import { Role } from '../../types';
import { formatDate, getStatusLabel, getApprovalStatusColor } from '../../utils/helpers';

interface TeamInfo {
  name: string;
  userCount: number;
  adminCount: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [totalTickets, setTotalTickets] = useState(0);
  const [activeTickets, setActiveTickets] = useState(0);
  const [completedTickets, setCompletedTickets] = useState(0);
  const [recentTickets, setRecentTickets] = useState<TicketDto[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const usersRes = await userService.getAllUsers(0, 200);
      const users = usersRes.content;
      setTotalUsers(users.filter((u: User) => u.roles.includes(Role.ROLE_USER)).length);
      setTotalAdmins(users.filter((u: User) => u.roles.includes(Role.ROLE_ADMIN)).length);

      const teamMap = new Map<string, { users: number; admins: number }>();
      users.forEach((u: User) => {
        if (u.teams) {
          u.teams.forEach((t) => {
            if (!teamMap.has(t)) teamMap.set(t, { users: 0, admins: 0 });
            const info = teamMap.get(t)!;
            if (u.roles.includes(Role.ROLE_ADMIN) || u.roles.includes(Role.ROLE_SUPER_ADMIN)) {
              info.admins++;
            }
            if (u.roles.includes(Role.ROLE_USER)) {
              info.users++;
            }
          });
        }
      });

      const teamList: TeamInfo[] = Array.from(teamMap.entries()).map(([name, info]) => ({
        name,
        userCount: info.users,
        adminCount: info.admins,
      }));
      setTeams(teamList);
    } catch {
      // handled by global interceptor
    }

    try {
      const [ticketsRes, receivedRes] = await Promise.all([
        ticketService.getMyTickets(0, 100, true),
        ticketService.getReceivedTickets(0, 100, true),
      ]);
      const allTickets = [...ticketsRes.content, ...receivedRes.content];
      const uniqueTickets = allTickets.filter(
        (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
      );
      setTotalTickets(uniqueTickets.length);
      setActiveTickets(uniqueTickets.filter((t) => t.status === 'PENDING').length);
      setCompletedTickets(uniqueTickets.filter((t) => t.status === 'APPROVED').length);
      setRecentTickets(uniqueTickets.slice(0, 10));
    } catch {
      setRecentTickets([]);
    }

    try {
      const [notifs, notifCount] = await Promise.all([
        notificationService.getUnread(),
        notificationService.getUnreadCount(),
      ]);
      setRecentNotifications(notifs.slice(0, 10));
      setUnreadCount(notifCount);
    } catch {
      setRecentNotifications([]);
      setUnreadCount(0);
    }

    setLoading(false);
  };

  const filteredTeams = selectedTeam === 'ALL' ? teams : teams.filter((t) => t.name === selectedTeam);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Toplam Ticket', value: totalTickets, icon: HiOutlineTicket, bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { label: 'Aktif Ticket', value: activeTickets, icon: HiOutlineChartBarSquare, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Tamamlanan Ticket', value: completedTickets, icon: HiOutlineTicket, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Okunmamış Bildirim', value: unreadCount, icon: HiOutlineBell, bg: 'bg-rose-50', text: 'text-rose-600', onClick: () => navigate('/notifications') },
    { label: 'Toplam Takım', value: teams.length, icon: HiOutlineBuildingOffice2, bg: 'bg-purple-50', text: 'text-purple-600', onClick: () => navigate('/teams') },
    { label: 'Toplam Kullanıcı', value: totalUsers, icon: HiOutlineUsers, bg: 'bg-blue-50', text: 'text-blue-600', onClick: () => navigate('/users') },
    { label: 'Toplam Admin', value: totalAdmins, icon: HiOutlineUserGroup, bg: 'bg-teal-50', text: 'text-teal-600', onClick: () => navigate('/users') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Son Ticket'lar</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTickets.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Henüz ticket yok</p>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-slate-800 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ticket.senderUsername} &bull; {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getApprovalStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Bildirimler</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full font-medium">
                {unreadCount} okunmamış
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {recentNotifications.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Henüz bildirim yok</p>
            ) : (
              recentNotifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (notif.referenceType === 'TASK' && notif.referenceId) navigate(`/tasks/${notif.referenceId}`);
                    else navigate('/notifications');
                  }}
                  className="w-full px-6 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${notif.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>{notif.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-slate-100">
            <button onClick={() => navigate('/notifications')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Tümünü Gör
            </button>
          </div>
        </div>
      </div>

      {/* Team Analytics */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800">Takım Analitikleri</h3>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">Tüm Takımlar</option>
            {teams.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        {filteredTeams.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">Takım bulunamadı</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredTeams.map((team) => (
              <div key={team.name} className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">{team.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Kullanıcı</p>
                    <p className="text-lg font-bold text-slate-700">{team.userCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Admin</p>
                    <p className="text-lg font-bold text-slate-700">{team.adminCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
