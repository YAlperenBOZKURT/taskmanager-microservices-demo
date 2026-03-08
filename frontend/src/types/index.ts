// TaskManager Frontend - TypeScript type definitions and interfaces
// Author: Yusuf Alperen Bozkurt

// user roles - these match the backend enum values
export enum Role {
  ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_USER = 'ROLE_USER',
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: Role[];
  team: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// task lifecycle states
export enum TaskStatus {
  ACTIVE = 'ACTIVE',
  PASSIVE = 'PASSIVE',
  APPROVED = 'APPROVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface TaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  approverId: string | null;
  teamLeaderId: string | null;
  assigneeIds: string[];
  dueDate: string | null;
  attachments: AttachmentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  createdAt: string;
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RequestType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
}

export interface TaskApprovalRequestDto {
  id: string;
  requestType: RequestType;
  taskId: string | null;
  requesterId: string;
  requesterUsername: string;
  status: ApprovalStatus;
  requestData: string;
  reviewedById: string | null;
  reviewedByUsername: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDto {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  emailSent: boolean;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TicketDto {
  id: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientRole: string;
  title: string;
  content: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

// generic paginated response from the backend
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
