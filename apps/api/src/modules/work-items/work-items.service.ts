import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, WorkPriority, WorkStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { workItemWhereForUser, isPrivileged } from '../../common/utils/scope';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkItemDto, UpdateWorkItemDto } from './dto/work-item.dto';

const listInclude = {
  process: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  outcome: { select: { id: true, status: true, expected: true, actual: true } },
} as const;

export type WorkListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  departmentId?: string;
  teamId?: string;
  employeeId?: string;
  managerId?: string;
  processId?: string;
  status?: WorkStatus;
  priority?: WorkPriority;
  outcome?: string;
  from?: string;
  to?: string;
  overdue?: string;
  blocked?: string;
  mine?: string;
};

@Injectable()
export class WorkItemsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private events: EventsGateway,
    private notifications: NotificationsService,
  ) {}

  private assertAccess(user: AuthUser) {
    if (!user.permissions.includes('WORK_VIEW') && !isPrivileged(user)) {
      throw new ForbiddenException({ message: 'Cannot view work', code: 'FORBIDDEN' });
    }
  }

  buildWhere(user: AuthUser, q: WorkListQuery): Prisma.WorkItemWhereInput {
    const parts: Prisma.WorkItemWhereInput[] = [workItemWhereForUser(user) as Prisma.WorkItemWhereInput];
    if (q.mine === 'true') {
      parts.push({
        OR: [{ assignedToId: user.id }, { tasks: { some: { assignedToId: user.id } } }],
      });
    }
    if (q.departmentId) parts.push({ departmentId: q.departmentId });
    if (q.teamId) parts.push({ teamId: q.teamId });
    if (q.employeeId) parts.push({ assignedToId: q.employeeId });
    if (q.managerId) parts.push({ managerId: q.managerId });
    if (q.processId) parts.push({ processId: q.processId });
    if (q.status) parts.push({ status: q.status });
    if (q.priority) parts.push({ priority: q.priority });
    if (q.outcome) parts.push({ outcome: { status: q.outcome as never } });
    if (q.from || q.to) {
      parts.push({
        createdAt: {
          ...(q.from ? { gte: new Date(q.from) } : {}),
          ...(q.to ? { lte: new Date(q.to) } : {}),
        },
      });
    }
    if (q.overdue === 'true') {
      parts.push({
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      });
    }
    if (q.blocked === 'true') parts.push({ status: 'BLOCKED' });
    if (q.search) {
      parts.push({
        OR: [
          { title: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
          { assignedTo: { firstName: { contains: q.search, mode: 'insensitive' } } },
          { assignedTo: { lastName: { contains: q.search, mode: 'insensitive' } } },
        ],
      });
    }
    return { AND: parts };
  }

  async list(user: AuthUser, q: WorkListQuery) {
    this.assertAccess(user);
    const where = this.buildWhere(user, q);
    const sortable: Record<string, Prisma.WorkItemOrderByWithRelationInput> = {
      title: { title: q.sortDir === 'desc' ? 'desc' : 'asc' },
      dueDate: { dueDate: q.sortDir === 'desc' ? 'desc' : 'asc' },
      priority: { priority: q.sortDir === 'desc' ? 'desc' : 'asc' },
      status: { status: q.sortDir === 'desc' ? 'desc' : 'asc' },
      updatedAt: { updatedAt: q.sortDir === 'desc' ? 'desc' : 'asc' },
      createdAt: { createdAt: q.sortDir === 'desc' ? 'desc' : 'asc' },
    };
    const orderBy = (q.sortBy && sortable[q.sortBy]) || { updatedAt: 'desc' as const };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.workItem.findMany({
        where,
        include: listInclude,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.workItem.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string, user: AuthUser) {
    const item = await this.prisma.workItem.findFirst({
      where: { id, ...(workItemWhereForUser(user) as Prisma.WorkItemWhereInput) },
      include: {
        ...listInclude,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        tasks: {
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { uploadedAt: 'desc' },
        },
        comments: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        outcome: {
          include: { reviewedBy: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException({ message: 'Work item not found', code: 'WORK_ITEM_NOT_FOUND' });
    const activity = await this.audit.forEntity('WorkItem', id, 80);
    return { ...item, activity };
  }

  async create(dto: CreateWorkItemDto, user: AuthUser) {
    const created = await this.prisma.workItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        processId: dto.processId,
        departmentId: dto.departmentId,
        teamId: dto.teamId,
        createdById: user.id,
        assignedToId: dto.assignedToId,
        managerId: dto.managerId ?? user.id,
        priority: dto.priority ?? 'MEDIUM',
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        expectedOutcome: dto.expectedOutcome,
        outcome: dto.expectedOutcome
          ? { create: { expected: dto.expectedOutcome, status: 'PENDING' } }
          : undefined,
        tasks: dto.tasks?.length
          ? {
              create: dto.tasks.map((t) => ({
                title: t.title,
                description: t.description,
                assignedToId: t.assignedToId,
                priority: t.priority ?? 'MEDIUM',
                dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                createdById: user.id,
              })),
            }
          : undefined,
      },
      include: listInclude,
    });
    await this.audit.record({
      entityType: 'WorkItem',
      entityId: created.id,
      action: 'WORK_CREATED',
      performedById: user.id,
      newValue: { title: created.title },
    });
    if (created.assignedToId && created.assignedToId !== user.id) {
      await this.notifications.notify({
        userId: created.assignedToId,
        title: 'Assigned work',
        message: `You were assigned "${created.title}".`,
        type: 'ASSIGNMENT',
        workItemId: created.id,
      });
    }
    this.events.emitToWork(created.id, 'work.created', created);
    return created;
  }

  async update(id: string, dto: UpdateWorkItemDto, user: AuthUser) {
    const existing = await this.prisma.workItem.findFirst({
      where: { id, ...(workItemWhereForUser(user) as Prisma.WorkItemWhereInput) },
    });
    if (!existing) throw new NotFoundException({ message: 'Work item not found', code: 'WORK_ITEM_NOT_FOUND' });

    const employeeLocked = user.role === 'EMPLOYEE' && existing.assignedToId !== user.id;
    if (employeeLocked) {
      throw new ForbiddenException({ message: 'You can only update your own work', code: 'FORBIDDEN' });
    }

    const data: Prisma.WorkItemUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.processId) data.process = { connect: { id: dto.processId } };
    if (dto.departmentId !== undefined) {
      data.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
    }
    if (dto.teamId !== undefined) {
      data.team = dto.teamId ? { connect: { id: dto.teamId } } : { disconnect: true };
    }
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId ? { connect: { id: dto.assignedToId } } : { disconnect: true };
    }
    if (dto.managerId !== undefined) {
      data.manager = dto.managerId ? { connect: { id: dto.managerId } } : { disconnect: true };
    }
    if (dto.priority) data.priority = dto.priority;
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === 'COMPLETED') data.completedDate = new Date();
    }
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.expectedOutcome !== undefined) data.expectedOutcome = dto.expectedOutcome;

    const updated = await this.prisma.workItem.update({
      where: { id },
      data,
      include: listInclude,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.audit.record({
        entityType: 'WorkItem',
        entityId: id,
        action: dto.status === 'COMPLETED' ? 'WORK_COMPLETED' : 'STATUS_CHANGED',
        performedById: user.id,
        oldValue: { status: existing.status },
        newValue: { status: dto.status },
      });
      this.events.emitToWork(id, 'work.statusChanged', updated);
    }
    if (dto.priority && dto.priority !== existing.priority) {
      await this.audit.record({
        entityType: 'WorkItem',
        entityId: id,
        action: 'PRIORITY_CHANGED',
        performedById: user.id,
        oldValue: { priority: existing.priority },
        newValue: { priority: dto.priority },
      });
    }
    if (dto.dueDate && existing.dueDate?.toISOString() !== new Date(dto.dueDate).toISOString()) {
      await this.audit.record({
        entityType: 'WorkItem',
        entityId: id,
        action: 'DUE_DATE_CHANGED',
        performedById: user.id,
        oldValue: { dueDate: existing.dueDate },
        newValue: { dueDate: dto.dueDate },
      });
    }
    if (dto.assignedToId && dto.assignedToId !== existing.assignedToId) {
      await this.audit.record({
        entityType: 'WorkItem',
        entityId: id,
        action: 'USER_ASSIGNED',
        performedById: user.id,
        newValue: { assignedToId: dto.assignedToId },
      });
      await this.notifications.notify({
        userId: dto.assignedToId,
        title: 'Assigned work',
        message: `You were assigned "${updated.title}".`,
        type: 'ASSIGNMENT',
        workItemId: id,
      });
    }
    this.events.emitToWork(id, 'work.updated', updated);
    return updated;
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.workItem.delete({ where: { id } });
    return { success: true };
  }

  async savedFilters(user: AuthUser) {
    return this.prisma.savedFilter.findMany({ where: { userId: user.id, entity: 'WorkItem' } });
  }

  async saveFilter(user: AuthUser, name: string, filters: Record<string, unknown>) {
    return this.prisma.savedFilter.create({
      data: { userId: user.id, name, entity: 'WorkItem', filters: filters as Prisma.InputJsonValue },
    });
  }

  async deleteFilter(id: string, user: AuthUser) {
    await this.prisma.savedFilter.deleteMany({ where: { id, userId: user.id } });
    return { success: true };
  }
}
