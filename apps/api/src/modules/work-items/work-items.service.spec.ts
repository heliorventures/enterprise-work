import { Test } from '@nestjs/testing';
import { WorkItemsService } from './work-items.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

const user: AuthUser = {
  id: 'mgr-1',
  email: 'mgr@x.com',
  role: 'MANAGER',
  permissions: ['WORK_VIEW', 'WORK_CREATE', 'WORK_UPDATE', 'WORK_ASSIGN'],
  departmentId: 'd1',
  teamId: 't1',
  managerId: null,
};

describe('WorkItemsService', () => {
  let service: WorkItemsService;
  const prisma = {
    workItem: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = { record: jest.fn(), forEntity: jest.fn() };
  const events = { emitToWork: jest.fn() };
  const notifications = { notify: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        WorkItemsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: EventsGateway, useValue: events },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(WorkItemsService);
  });

  it('creates a work item and notifies assignee', async () => {
    prisma.workItem.create.mockResolvedValue({
      id: 'w1',
      title: 'ABC Onboarding',
      assignedToId: 'emp-1',
    });
    const created = await service.create(
      {
        title: 'ABC Onboarding',
        processId: 'p1',
        assignedToId: 'emp-1',
        expectedOutcome: 'Complete onboarding',
      },
      user,
    );
    expect(created.id).toBe('w1');
    expect(notifications.notify).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'WORK_CREATED' }));
  });

  it('records status changes', async () => {
    prisma.workItem.findFirst.mockResolvedValue({
      id: 'w1',
      assignedToId: 'emp-1',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: null,
    });
    prisma.workItem.update.mockResolvedValue({ id: 'w1', status: 'COMPLETED', title: 'X' });
    await service.update('w1', { status: 'COMPLETED' }, user);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'WORK_COMPLETED' }));
  });
});
