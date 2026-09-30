import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export class ProcessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@Injectable()
export class ProcessesService {
  constructor(private prisma: PrismaService) {}

  list(activeOnly = false) {
    return this.prisma.process.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        department: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { workItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.process.findUnique({
      where: { id },
      include: {
        department: true,
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!row) throw new NotFoundException({ message: 'Process not found', code: 'PROCESS_NOT_FOUND' });
    return row;
  }

  async analytics(id: string) {
    const process = await this.get(id);
    const items = await this.prisma.workItem.findMany({
      where: { processId: id },
      include: { outcome: true },
    });
    const now = new Date();
    const byStatus = items.reduce<Record<string, number>>((acc, w) => {
      acc[w.status] = (acc[w.status] || 0) + 1;
      return acc;
    }, {});
    const completed = items.filter((w) => w.status === 'COMPLETED' && w.startDate && w.completedDate);
    const avgCompletion =
      completed.length === 0
        ? 0
        : completed.reduce((s, w) => s + (w.completedDate!.getTime() - w.startDate!.getTime()), 0) /
          completed.length /
          86_400_000;
    const inFlight = items.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status) && w.startDate);
    const avgProcessing =
      inFlight.length === 0
        ? avgCompletion
        : inFlight.reduce((s, w) => s + (now.getTime() - w.startDate!.getTime()), 0) / inFlight.length / 86_400_000;
    const outcomes = items.map((w) => w.outcome?.status).filter(Boolean);
    const achieved = outcomes.filter((s) => s === 'ACHIEVED').length;
    const overdue = items.filter(
      (w) => w.dueDate && w.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(w.status),
    );
    const blocked = items.filter((w) => w.status === 'BLOCKED');
    let bottleneck = 'None';
    if (blocked.length >= 2) bottleneck = 'Blocked work accumulating';
    else if (overdue.length >= 2) bottleneck = 'Due-date slippage';
    else if ((byStatus.IN_REVIEW || 0) >= 3) bottleneck = 'Review queue';
    return {
      process,
      total: items.length,
      completed: byStatus.COMPLETED || 0,
      inProgress: byStatus.IN_PROGRESS || 0,
      blocked: byStatus.BLOCKED || 0,
      overdue: overdue.length,
      notStarted: byStatus.NOT_STARTED || 0,
      inReview: byStatus.IN_REVIEW || 0,
      averageCompletionDays: Number(avgCompletion.toFixed(1)),
      averageProcessingDays: Number(avgProcessing.toFixed(1)),
      outcomeAchievementRate: outcomes.length ? Math.round((achieved / outcomes.length) * 100) : 0,
      bottleneck,
    };
  }

  create(dto: ProcessDto) {
    if (!dto.name) throw new BadRequestException({ message: 'Name is required', code: 'VALIDATION' });
    return this.prisma.process.create({
      data: {
        name: dto.name,
        description: dto.description,
        departmentId: dto.departmentId,
        ownerId: dto.ownerId,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: Partial<ProcessDto>) {
    await this.get(id);
    return this.prisma.process.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.process.update({ where: { id }, data: { active: false } });
    return { success: true };
  }
}
