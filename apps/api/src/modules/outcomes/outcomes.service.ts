import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OutcomeStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';

export class UpsertOutcomeDto {
  @IsOptional()
  @IsString()
  expected?: string;
  @IsOptional()
  @IsString()
  actual?: string;
  @IsOptional()
  @IsEnum(OutcomeStatus)
  status?: OutcomeStatus;
}

@Injectable()
export class OutcomesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  async upsert(workItemId: string, dto: UpsertOutcomeDto, user: AuthUser) {
    const existing = await this.prisma.outcome.findUnique({ where: { workItemId } });
    const reviewing = dto.status && dto.status !== 'PENDING';
    const outcome = existing
      ? await this.prisma.outcome.update({
          where: { workItemId },
          data: {
            expected: dto.expected,
            actual: dto.actual,
            status: dto.status,
            reviewedById: reviewing ? user.id : undefined,
            reviewedAt: reviewing ? new Date() : undefined,
          },
        })
      : await this.prisma.outcome.create({
          data: {
            workItemId,
            expected: dto.expected ?? '',
            actual: dto.actual,
            status: dto.status ?? 'PENDING',
            reviewedById: reviewing ? user.id : undefined,
            reviewedAt: reviewing ? new Date() : undefined,
          },
        });
    if (dto.expected) {
      await this.prisma.workItem.update({
        where: { id: workItemId },
        data: { expectedOutcome: dto.expected },
      });
    }
    await this.audit.record({
      entityType: 'Outcome',
      entityId: workItemId,
      action: reviewing ? 'OUTCOME_REVIEWED' : 'OUTCOME_UPDATED',
      performedById: user.id,
      newValue: { status: outcome.status },
    });
    this.events.emitToWork(workItemId, 'work.updated', { workItemId, outcome });
    return outcome;
  }

  async get(workItemId: string) {
    const row = await this.prisma.outcome.findUnique({
      where: { workItemId },
      include: { reviewedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!row) throw new NotFoundException({ message: 'Outcome not found', code: 'OUTCOME_NOT_FOUND' });
    return row;
  }
}
