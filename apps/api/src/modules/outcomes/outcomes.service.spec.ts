import { Test } from '@nestjs/testing';
import { OutcomesService } from './outcomes.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('OutcomesService', () => {
  it('reviews an outcome and stamps reviewer', async () => {
    const prisma = {
      outcome: {
        findUnique: jest.fn().mockResolvedValue({ workItemId: 'w1', status: 'PENDING' }),
        update: jest.fn().mockResolvedValue({ workItemId: 'w1', status: 'ACHIEVED' }),
      },
      workItem: { update: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        OutcomesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: EventsGateway, useValue: { emitToWork: jest.fn() } },
      ],
    }).compile();
    const service = module.get(OutcomesService);
    const user: AuthUser = {
      id: 'mgr',
      email: 'm@x.com',
      role: 'MANAGER',
      permissions: ['OUTCOME_REVIEW'],
      departmentId: null,
      teamId: null,
      managerId: null,
    };
    const result = await service.upsert('w1', { actual: 'Done', status: 'ACHIEVED' }, user);
    expect(result.status).toBe('ACHIEVED');
    expect(prisma.outcome.update).toHaveBeenCalled();
  });
});
