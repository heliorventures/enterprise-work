import { DashboardService } from './dashboard.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('DashboardService', () => {
  it('returns KPI cards for executive view', async () => {
    const prisma = {
      workItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            status: 'IN_PROGRESS',
            dueDate: new Date(Date.now() - 86400000),
            department: { name: 'Operations' },
            process: { name: 'Client Onboarding' },
            assignedToId: 'e1',
            assignedTo: { firstName: 'Liam', lastName: 'Foster', department: { name: 'Operations' } },
            outcome: { status: 'PENDING' },
            priority: 'HIGH',
            title: 'ABC',
            id: '1',
          },
          {
            status: 'COMPLETED',
            dueDate: new Date(),
            department: { name: 'Technology' },
            process: { name: 'Application Development' },
            assignedToId: 'e2',
            assignedTo: { firstName: 'Maya', lastName: 'Singh', department: { name: 'Technology' } },
            outcome: { status: 'ACHIEVED' },
            priority: 'MEDIUM',
            title: 'SSO',
            id: '2',
          },
          {
            status: 'BLOCKED',
            dueDate: new Date(Date.now() + 86400000),
            department: { name: 'Compliance' },
            process: { name: 'Compliance Review' },
            assignedToId: 'e1',
            assignedTo: { firstName: 'Liam', lastName: 'Foster', department: { name: 'Operations' } },
            outcome: { status: 'PENDING' },
            priority: 'CRITICAL',
            title: 'SOC',
            id: '3',
          },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
      user: {
        count: jest.fn().mockResolvedValue(15),
        findMany: jest.fn().mockResolvedValue([
          { id: 'e1', firstName: 'Liam', lastName: 'Foster', department: { name: 'Operations' } },
        ]),
      },
    };
    const service = new DashboardService(prisma as never);
    const user: AuthUser = {
      id: 'vp',
      email: 'vp@x.com',
      role: 'VP',
      permissions: ['DASHBOARD_VIEW'],
      departmentId: null,
      teamId: null,
      managerId: null,
    };
    const result = await service.executive(user, {});
    expect(result.kpis.activeWork).toBe(2);
    expect(result.kpis.completed).toBe(1);
    expect(result.kpis.blocked).toBe(1);
    expect(result.kpis.outcomesAchieved).toBe(1);
    expect(result.statusCounts.IN_PROGRESS).toBe(1);
  });
});
