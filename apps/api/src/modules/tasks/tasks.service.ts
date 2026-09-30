import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkPriority, WorkStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

export class CreateTaskDto {
  @IsString()
  workItemId!: string;
  @IsOptional()
  @IsString()
  parentTaskId?: string;
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  assignedToId?: string;
  @IsOptional()
  @IsEnum(WorkPriority)
  priority?: WorkPriority;
  @IsOptional()
  @IsDateString()
  startDate?: string;
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  assignedToId?: string | null;
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;
  @IsOptional()
  @IsEnum(WorkPriority)
  priority?: WorkPriority;
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private events: EventsGateway,
    private notifications: NotificationsService,
  ) {}

  list(workItemId?: string, assignedToId?: string) {
    return this.prisma.task.findMany({
      where: {
        ...(workItemId ? { workItemId } : {}),
        ...(assignedToId ? { assignedToId } : {}),
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        workItem: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateTaskDto, user: AuthUser) {
    const task = await this.prisma.task.create({
      data: {
        workItemId: dto.workItemId,
        parentTaskId: dto.parentTaskId,
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        priority: dto.priority ?? 'MEDIUM',
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: user.id,
      },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
    });
    await this.audit.record({
      entityType: 'Task',
      entityId: dto.workItemId,
      action: 'TASK_CREATED',
      performedById: user.id,
      newValue: { title: dto.title },
    });
    if (dto.assignedToId && dto.assignedToId !== user.id) {
      await this.notifications.notify({
        userId: dto.assignedToId,
        title: 'New task',
        message: `You were assigned a new task: "${dto.title}".`,
        type: 'ASSIGNMENT',
        workItemId: dto.workItemId,
      });
    }
    this.events.emitToWork(dto.workItemId, 'task.updated', task);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: AuthUser) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: 'Task not found', code: 'TASK_NOT_FOUND' });
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        completedDate: dto.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (dto.status && dto.status !== existing.status) {
      await this.audit.record({
        entityType: 'Task',
        entityId: existing.workItemId,
        action: 'TASK_STATUS_CHANGED',
        performedById: user.id,
        oldValue: { status: existing.status, task: existing.title },
        newValue: { status: dto.status, task: existing.title },
      });
      if (dto.status === 'COMPLETED' && existing.createdById !== user.id) {
        await this.notifications.notify({
          userId: existing.createdById,
          title: 'Task completed',
          message: `Task "${existing.title}" was marked completed.`,
          type: 'STATUS',
          workItemId: existing.workItemId,
        });
      }
    }
    if (dto.assignedToId && dto.assignedToId !== existing.assignedToId) {
      await this.audit.record({
        entityType: 'Task',
        entityId: existing.workItemId,
        action: 'TASK_ASSIGNED',
        performedById: user.id,
        newValue: { assignedToId: dto.assignedToId, task: existing.title },
      });
    }
    this.events.emitToWork(existing.workItemId, 'task.updated', updated);
    return updated;
  }

  async remove(id: string) {
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }
}
