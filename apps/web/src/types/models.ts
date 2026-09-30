export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'VP' | 'DEPARTMENT_HEAD' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  profileImage?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  managerId?: string | null;
  lastLoginAt?: string | null;
  role: { id: string; name: RoleName; description?: string | null };
  department?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  permissions: string[];
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;
  expectedOutcome?: string | null;
  updatedAt: string;
  createdAt: string;
  process?: { id: string; name: string };
  department?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string };
  outcome?: { id: string; status: string; expected?: string; actual?: string | null } | null;
  tasks?: Task[];
  documents?: DocumentFile[];
  comments?: Comment[];
  activity?: AuditEvent[];
}

export interface Task {
  id: string;
  workItemId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
}

export interface DocumentFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  version: number;
  uploadedAt: string;
  description?: string | null;
  workItemId?: string | null;
  uploadedBy?: { id: string; firstName: string; lastName: string };
}

export interface Comment {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface AuditEvent {
  id: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: string;
  performedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  BLOCKED: 'Blocked',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const OUTCOME_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ACHIEVED: 'Achieved',
  PARTIALLY_ACHIEVED: 'Partially Achieved',
  NOT_ACHIEVED: 'Not Achieved',
};
