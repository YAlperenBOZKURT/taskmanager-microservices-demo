// TaskManager Frontend - TypeScript type definitions and interfaces

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
  teams: string[];
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

export enum TaskStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface TaskProgressEntryDto {
  id: string;
  taskId: string;
  message: string;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string;
  team: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  assigneeIds: string[];
  dueDate: string | null;
  attachments: AttachmentDto[];
  progressEntries: TaskProgressEntryDto[];
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
  COMPLETION = 'COMPLETION',
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

export enum TicketStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface TicketDto {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverIds: string[];
  teamIds: string[];
  title: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
