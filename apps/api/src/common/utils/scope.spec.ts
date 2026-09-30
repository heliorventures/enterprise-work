import { workItemWhereForUser, isPrivileged, userWhereForViewer } from './scope';
import { AuthUser } from '../interfaces/auth-user.interface';

const base: AuthUser = {
  id: 'u1',
  email: 'a@b.c',
  role: 'EMPLOYEE',
  permissions: ['WORK_VIEW'],
  departmentId: 'd1',
  teamId: 't1',
  managerId: 'm1',
};

describe('RBAC scope', () => {
  it('treats VP as privileged', () => {
    expect(isPrivileged({ ...base, role: 'VP' })).toBe(true);
    expect(isPrivileged(base)).toBe(false);
  });

  it('scopes employees to own work', () => {
    const where = workItemWhereForUser(base) as { OR: unknown[] };
    expect(where.OR).toBeDefined();
  });

  it('scopes department heads to department', () => {
    const where = workItemWhereForUser({ ...base, role: 'DEPARTMENT_HEAD' });
    expect(where).toEqual({ departmentId: 'd1' });
  });

  it('does not restrict admins', () => {
    expect(workItemWhereForUser({ ...base, role: 'ADMIN' })).toEqual({});
    expect(userWhereForViewer({ ...base, role: 'SUPER_ADMIN' })).toEqual({});
  });
});
