import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async record(params: {
    entityType: string;
    entityId: string;
    action: string;
    performedById?: string | null;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedById: params.performedById ?? null,
        oldValue: params.oldValue ?? Prisma.JsonNull,
        newValue: params.newValue ?? Prisma.JsonNull,
      },
    });
  }

  async forEntity(entityType: string, entityId: string, take = 50) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { timestamp: 'desc' },
      take,
    });
  }

  async list(params: { entityType?: string; entityId?: string; page: number; pageSize: number }) {
    const where = {
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { performedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { timestamp: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }
}
