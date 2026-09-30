import { AuthUser } from '../interfaces/auth-user.interface';

export function isPrivileged(user: AuthUser) {
  return ['SUPER_ADMIN', 'ADMIN', 'VP'].includes(user.role);
}

export function workItemWhereForUser(user: AuthUser): Record<string, unknown> {
  if (isPrivileged(user)) return {};
  if (user.role === 'DEPARTMENT_HEAD' && user.departmentId) {
    return { departmentId: user.departmentId };
  }
  if (user.role === 'MANAGER') {
    return {
      OR: [
        { managerId: user.id },
        { assignedToId: user.id },
        { teamId: user.teamId },
        { assignedTo: { managerId: user.id } },
      ],
    };
  }
  return {
    OR: [{ assignedToId: user.id }, { createdById: user.id }, { tasks: { some: { assignedToId: user.id } } }],
  };
}

export function userWhereForViewer(user: AuthUser): Record<string, unknown> {
  if (isPrivileged(user)) return {};
  if (user.role === 'DEPARTMENT_HEAD' && user.departmentId) {
    return { departmentId: user.departmentId };
  }
  if (user.role === 'MANAGER') {
    return { OR: [{ id: user.id }, { managerId: user.id }, { teamId: user.teamId }] };
  }
  return { id: user.id };
}
