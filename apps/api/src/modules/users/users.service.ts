import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { userWhereForViewer } from '../../common/utils/scope';
import { AuditService } from '../audit/audit.service';

const publicUser = {
  id: true,
  employeeId: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
  profileImage: true,
  departmentId: true,
  teamId: true,
  managerId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list(user: AuthUser, q: { search?: string; departmentId?: string; teamId?: string; page: number; pageSize: number }) {
    const where: Prisma.UserWhereInput = {
      AND: [
        userWhereForViewer(user) as Prisma.UserWhereInput,
        q.departmentId ? { departmentId: q.departmentId } : {},
        q.teamId ? { teamId: q.teamId } : {},
        q.search
          ? {
              OR: [
                { firstName: { contains: q.search, mode: 'insensitive' } },
                { lastName: { contains: q.search, mode: 'insensitive' } },
                { email: { contains: q.search, mode: 'insensitive' } },
                { employeeId: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: publicUser,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string, viewer: AuthUser) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...(userWhereForViewer(viewer) as Prisma.UserWhereInput) },
      select: {
        ...publicUser,
        reports: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!user) throw new NotFoundException({ message: 'User not found', code: 'USER_NOT_FOUND' });
    return user;
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    const created = await this.prisma.user.create({
      data: {
        employeeId: dto.employeeId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        roleId: dto.roleId,
        departmentId: dto.departmentId,
        teamId: dto.teamId,
        managerId: dto.managerId,
      },
      select: publicUser,
    });
    await this.audit.record({
      entityType: 'User',
      entityId: created.id,
      action: 'USER_CREATED',
      performedById: actor.id,
      newValue: { email: created.email },
    });
    return created;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: 'User not found', code: 'USER_NOT_FOUND' });
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase(),
        roleId: dto.roleId,
        departmentId: dto.departmentId,
        teamId: dto.teamId,
        managerId: dto.managerId,
        status: dto.status,
        profileImage: dto.profileImage,
      },
      select: publicUser,
    });
    await this.audit.record({
      entityType: 'User',
      entityId: id,
      action: 'USER_UPDATED',
      performedById: actor.id,
    });
    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    await this.prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } });
    await this.audit.record({
      entityType: 'User',
      entityId: id,
      action: 'USER_DELETED',
      performedById: actor.id,
    });
    return { success: true };
  }
}
