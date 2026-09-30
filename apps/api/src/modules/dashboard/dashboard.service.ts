import { Injectable } from '@nestjs/common';
import { Prisma, WorkStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { workItemWhereForUser } from '../../common/utils/scope';

export type DashFilters = {
  from?: string;
  to?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  employeeId?: string;
  processId?: string;
  status?: WorkStatus;
  priority?: string;
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private scope(user: AuthUser, f: DashFilters): Prisma.WorkItemWhereInput {
    const parts: Prisma.WorkItemWhereInput[] = [workItemWhereForUser(user) as Prisma.WorkItemWhereInput];
    if (f.departmentId) parts.push({ departmentId: f.departmentId });
    if (f.teamId) parts.push({ teamId: f.teamId });
    if (f.managerId) parts.push({ managerId: f.managerId });
    if (f.employeeId) parts.push({ assignedToId: f.employeeId });
    if (f.processId) parts.push({ processId: f.processId });
    if (f.status) parts.push({ status: f.status });
    if (f.priority) parts.push({ priority: f.priority as never });
    if (f.from || f.to) {
      parts.push({
        createdAt: {
          ...(f.from ? { gte: new Date(f.from) } : {}),
          ...(f.to ? { lte: new Date(f.to) } : {}),
        },
      });
    }
    return { AND: parts };
  }

  private workload(active: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (active >= 8) return 'CRITICAL';
    if (active >= 5) return 'HIGH';
    if (active >= 3) return 'MEDIUM';
    return 'LOW';
  }

  async executive(user: AuthUser, f: DashFilters) {
    const where = this.scope(user, f);
    const now = new Date();
    const items = await this.prisma.workItem.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        process: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        outcome: true,
      },
    });
    const open = items.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status));
    const completed = items.filter((w) => w.status === 'COMPLETED');
    const overdue = open.filter((w) => w.dueDate && w.dueDate < now);
    const blocked = items.filter((w) => w.status === 'BLOCKED');
    const resources = await this.prisma.user.count({
      where: { status: 'ACTIVE', ...(f.departmentId ? { departmentId: f.departmentId } : {}) },
    });
    const achieved = items.filter((w) => w.outcome?.status === 'ACHIEVED').length;
    const prevFrom = f.from ? new Date(f.from) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const windowMs = (f.to ? new Date(f.to).getTime() : now.getTime()) - prevFrom.getTime();
    const priorItems = await this.prisma.workItem.count({
      where: {
        AND: [
          workItemWhereForUser(user) as Prisma.WorkItemWhereInput,
          { createdAt: { gte: new Date(prevFrom.getTime() - windowMs), lt: prevFrom } },
        ],
      },
    });
    const activeDelta = priorItems === 0 ? 100 : Math.round(((open.length - priorItems) / Math.max(priorItems, 1)) * 100);

    const statusCounts = items.reduce<Record<string, number>>((acc, w) => {
      acc[w.status] = (acc[w.status] || 0) + 1;
      return acc;
    }, {});
    const byDeptMap = new Map<string, number>();
    const byProcMap = new Map<string, number>();
    for (const w of items) {
      const dn = w.department?.name ?? 'Unassigned';
      const pn = w.process?.name ?? 'Unknown';
      byDeptMap.set(dn, (byDeptMap.get(dn) || 0) + 1);
      byProcMap.set(pn, (byProcMap.get(pn) || 0) + 1);
    }

    const userIds = [...new Set(items.map((w) => w.assignedToId).filter(Boolean))] as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { department: { select: { name: true } } },
    });
    const workload = users.map((u) => {
      const assigned = items.filter((w) => w.assignedToId === u.id);
      const active = assigned.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status)).length;
      return {
        id: u.id,
        employee: `${u.firstName} ${u.lastName}`,
        department: u.department?.name ?? '—',
        active,
        completed: assigned.filter((w) => w.status === 'COMPLETED').length,
        overdue: assigned.filter((w) => w.dueDate && w.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(w.status)).length,
        workload: this.workload(active),
      };
    });

    const outcomePerf = {
      ACHIEVED: items.filter((w) => w.outcome?.status === 'ACHIEVED').length,
      PARTIALLY_ACHIEVED: items.filter((w) => w.outcome?.status === 'PARTIALLY_ACHIEVED').length,
      PENDING: items.filter((w) => !w.outcome || w.outcome.status === 'PENDING').length,
      NOT_ACHIEVED: items.filter((w) => w.outcome?.status === 'NOT_ACHIEVED').length,
    };

    const slim = (w: (typeof items)[number]) => ({
      id: w.id,
      title: w.title,
      status: w.status,
      priority: w.priority,
      dueDate: w.dueDate,
      assignedTo: w.assignedTo,
      department: w.department,
      process: w.process,
      outcome: w.outcome?.status,
    });

    return {
      kpis: {
        activeWork: open.length,
        activeDelta,
        completed: completed.length,
        overdue: overdue.length,
        blocked: blocked.length,
        resources,
        outcomesAchieved: achieved,
      },
      statusCounts,
      workByDepartment: [...byDeptMap.entries()].map(([name, value]) => ({ name, value })),
      workByProcess: [...byProcMap.entries()].map(([name, value]) => ({ name, value })),
      workload,
      outcomePerformance: outcomePerf,
      overdueItems: overdue.sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0)).slice(0, 12).map(slim),
      blockedItems: blocked.slice(0, 12).map(slim),
    };
  }

  async manager(user: AuthUser, f: DashFilters) {
    const exec = await this.executive(user, f);
    const teamMembers = await this.prisma.user.findMany({
      where: {
        OR: [{ id: user.id }, { managerId: user.id }, { teamId: user.teamId ?? undefined }],
        status: 'ACTIVE',
      },
      select: { id: true, firstName: true, lastName: true },
    });
    const where = this.scope(user, f);
    const completed = await this.prisma.workItem.findMany({
      where: { AND: [where, { status: 'COMPLETED', startDate: { not: null }, completedDate: { not: null } }] },
    });
    const avgDays =
      completed.length === 0
        ? 0
        : completed.reduce((s, w) => s + (w.completedDate!.getTime() - w.startDate!.getTime()), 0) /
          completed.length /
          86_400_000;
    const pendingReviews = await this.prisma.workItem.findMany({
      where: { AND: [where, { status: 'IN_REVIEW' }] },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        process: { select: { name: true } },
      },
      take: 15,
    });
    const activity = await this.prisma.auditLog.findMany({
      where: { performedById: { in: teamMembers.map((m) => m.id) } },
      include: { performedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { timestamp: 'desc' },
      take: 15,
    });
    const performance = exec.workload.map((w) => ({
      ...w,
      completionRate: w.active + w.completed === 0 ? 0 : Math.round((w.completed / (w.active + w.completed)) * 100),
    }));
    return {
      kpis: {
        teamSize: teamMembers.length,
        ...exec.kpis,
        averageCompletionDays: Number(avgDays.toFixed(1)),
      },
      workload: exec.workload,
      performance,
      overdueItems: exec.overdueItems,
      pendingReviews,
      recentActivity: activity,
    };
  }

  async employee(user: AuthUser) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86_400_000);
    const assigned = await this.prisma.workItem.findMany({
      where: {
        OR: [{ assignedToId: user.id }, { tasks: { some: { assignedToId: user.id } } }],
      },
      include: {
        process: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        outcome: true,
        tasks: {
          where: { assignedToId: user.id },
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    const bucket = (pred: (w: (typeof assigned)[number]) => boolean) => assigned.filter(pred);
    return {
      today: bucket((w) => !!w.dueDate && w.dueDate >= startOfDay && w.dueDate < endOfDay && !['COMPLETED', 'CANCELLED'].includes(w.status)),
      upcoming: bucket((w) => !!w.dueDate && w.dueDate >= endOfDay && !['COMPLETED', 'CANCELLED'].includes(w.status)),
      overdue: bucket((w) => !!w.dueDate && w.dueDate < startOfDay && !['COMPLETED', 'CANCELLED'].includes(w.status)),
      completed: bucket((w) => w.status === 'COMPLETED').slice(0, 20),
      blocked: bucket((w) => w.status === 'BLOCKED'),
      all: assigned,
    };
  }

  async resources(user: AuthUser, f: DashFilters) {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: { name: { in: ['EMPLOYEE', 'MANAGER', 'DEPARTMENT_HEAD'] } },
        ...(f.departmentId ? { departmentId: f.departmentId } : {}),
        ...(f.teamId ? { teamId: f.teamId } : {}),
      },
      include: { department: { select: { name: true } }, team: { select: { name: true } } },
    });
    const where = this.scope(user, f);
    const items = await this.prisma.workItem.findMany({ where });
    const now = new Date();
    return users.map((u) => {
      const assigned = items.filter((w) => w.assignedToId === u.id);
      const active = assigned.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status)).length;
      return {
        id: u.id,
        employee: `${u.firstName} ${u.lastName}`,
        email: u.email,
        department: u.department?.name ?? '—',
        team: u.team?.name ?? '—',
        active,
        completed: assigned.filter((w) => w.status === 'COMPLETED').length,
        overdue: assigned.filter((w) => w.dueDate && w.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(w.status)).length,
        highPriority: assigned.filter((w) => ['HIGH', 'CRITICAL'].includes(w.priority) && !['COMPLETED', 'CANCELLED'].includes(w.status)).length,
        workload: this.workload(active),
      };
    });
  }

  async employeeProfile(id: string, user: AuthUser) {
    const person = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        role: { select: { name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const items = await this.prisma.workItem.findMany({
      where: {
        AND: [workItemWhereForUser(user) as Prisma.WorkItemWhereInput, { assignedToId: id }],
      },
      include: { process: { select: { name: true } }, outcome: true },
      orderBy: { updatedAt: 'desc' },
    });
    const now = new Date();
    const activity = await this.prisma.auditLog.findMany({
      where: { performedById: id },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    const outcomes = items.reduce(
      (acc, w) => {
        const s = w.outcome?.status ?? 'PENDING';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return {
      person,
      active: items.filter((w) => !['COMPLETED', 'CANCELLED'].includes(w.status)),
      completed: items.filter((w) => w.status === 'COMPLETED'),
      overdue: items.filter((w) => w.dueDate && w.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(w.status)),
      upcoming: items.filter((w) => w.dueDate && w.dueDate >= now && !['COMPLETED', 'CANCELLED'].includes(w.status)),
      outcomes,
      activity,
    };
  }
}
