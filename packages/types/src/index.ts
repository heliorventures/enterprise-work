export const RoleName = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VP: 'VP',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const PermissionCode = {
  USER_VIEW: 'USER_VIEW',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  TASK_VIEW: 'TASK_VIEW',
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_DELETE: 'TASK_DELETE',
  TASK_ASSIGN: 'TASK_ASSIGN',
  PROCESS_VIEW: 'PROCESS_VIEW',
  PROCESS_CREATE: 'PROCESS_CREATE',
  PROCESS_UPDATE: 'PROCESS_UPDATE',
  PROCESS_DELETE: 'PROCESS_DELETE',
  DOCUMENT_VIEW: 'DOCUMENT_VIEW',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',
  OUTCOME_VIEW: 'OUTCOME_VIEW',
  OUTCOME_CREATE: 'OUTCOME_CREATE',
  OUTCOME_REVIEW: 'OUTCOME_REVIEW',
  REPORT_VIEW: 'REPORT_VIEW',
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  WORK_VIEW: 'WORK_VIEW',
  WORK_CREATE: 'WORK_CREATE',
  WORK_UPDATE: 'WORK_UPDATE',
  WORK_DELETE: 'WORK_DELETE',
  WORK_ASSIGN: 'WORK_ASSIGN',
  DEPARTMENT_VIEW: 'DEPARTMENT_VIEW',
  DEPARTMENT_MANAGE: 'DEPARTMENT_MANAGE',
  TEAM_VIEW: 'TEAM_VIEW',
  TEAM_MANAGE: 'TEAM_MANAGE',
  ROLE_MANAGE: 'ROLE_MANAGE',
  SETTINGS_MANAGE: 'SETTINGS_MANAGE',
  AUDIT_VIEW: 'AUDIT_VIEW',
  COMMENT_CREATE: 'COMMENT_CREATE',
  NOTIFICATION_VIEW: 'NOTIFICATION_VIEW',
} as const;

export type PermissionCode = (typeof PermissionCode)[keyof typeof PermissionCode];

export const WorkPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type WorkPriority = (typeof WorkPriority)[keyof typeof WorkPriority];

export const WorkStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  BLOCKED: 'BLOCKED',
  IN_REVIEW: 'IN_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export const OutcomeStatus = {
  PENDING: 'PENDING',
  ACHIEVED: 'ACHIEVED',
  PARTIALLY_ACHIEVED: 'PARTIALLY_ACHIEVED',
  NOT_ACHIEVED: 'NOT_ACHIEVED',
} as const;

export type OutcomeStatus = (typeof OutcomeStatus)[keyof typeof OutcomeStatus];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const WorkloadLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type WorkloadLevel = (typeof WorkloadLevel)[keyof typeof WorkloadLevel];

export const SocketEvents = {
  WORK_CREATED: 'work.created',
  WORK_UPDATED: 'work.updated',
  WORK_STATUS_CHANGED: 'work.statusChanged',
  TASK_UPDATED: 'task.updated',
  DOCUMENT_UPLOADED: 'document.uploaded',
  COMMENT_CREATED: 'comment.created',
  NOTIFICATION_CREATED: 'notification.created',
} as const;
