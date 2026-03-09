// TaskManager Frontend - Helper/utility functions for formatting and display
// Author: Yusuf Alperen Bozkurt

import { Role } from '../types';

export function getRoleLabel(role: Role): string {
  switch (role) {
    case Role.ROLE_SUPER_ADMIN:
      return 'Super Admin';
    case Role.ROLE_ADMIN:
      return 'Admin';
    case Role.ROLE_USER:
      return 'Kullanıcı';
    default:
      return role;
  }
}

export function getHighestRole(roles: Role[]): Role {
  if (roles.includes(Role.ROLE_SUPER_ADMIN)) return Role.ROLE_SUPER_ADMIN;
  if (roles.includes(Role.ROLE_ADMIN)) return Role.ROLE_ADMIN;
  return Role.ROLE_USER;
}

export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?';
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleBadgeColor(role: Role): string {
  switch (role) {
    case Role.ROLE_SUPER_ADMIN:
      return 'bg-purple-100 text-purple-700';
    case Role.ROLE_ADMIN:
      return 'bg-blue-100 text-blue-700';
    case Role.ROLE_USER:
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-700';
    case 'HIGH':
      return 'bg-orange-100 text-orange-700';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700';
    case 'LOW':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return 'Kritik';
    case 'HIGH': return 'Yüksek';
    case 'MEDIUM': return 'Orta';
    case 'LOW': return 'Düşük';
    default: return priority;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-700';
    case 'PENDING':
      return 'bg-orange-100 text-orange-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'PENDING': return 'Pending Approval';
    case 'COMPLETED': return 'Onaylandı';
    case 'APPROVED': return 'Onaylandı';
    case 'REJECTED': return 'Reddedildi';
    default: return status;
  }
}

export function getApprovalStatusColor(status: string): string {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'APPROVED': return 'bg-green-100 text-green-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
