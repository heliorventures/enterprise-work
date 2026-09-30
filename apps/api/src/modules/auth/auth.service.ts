import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuditService } from '../audit/audit.service';

const USER_SAFE = {
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
  role: { select: { id: true, name: true, description: true } },
  department: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(value: string, fallbackMs: number) {
    const m = /^(\d+)([smhd])$/.exec(value);
    if (!m) return fallbackMs;
    const n = Number(m[1]);
    const unit = m[2];
    const mul = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return n * mul;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({ message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user.id, user.email, user.role.name);
    await this.audit.record({
      entityType: 'User',
      entityId: user.id,
      action: 'LOGIN',
      performedById: user.id,
    });
    return {
      ...tokens,
      user: this.toPublic(user),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({ message: 'Session expired', code: 'SESSION_EXPIRED' });
    }
    try {
      await this.jwt.verifyAsync(refreshToken, { secret: this.config.get('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException({ message: 'Session expired', code: 'SESSION_EXPIRED' });
    }
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ message: 'Session expired', code: 'SESSION_EXPIRED' });
    }
    const tokens = await this.issueTokens(user.id, user.email, user.role.name);
    return { ...tokens, user: this.toPublic(user) };
  }

  async logout(refreshToken: string | undefined, userId: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }

  async changePassword(user: AuthUser, currentPassword: string, newPassword: string) {
    const db = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!db) throw new UnauthorizedException();
    const ok = await bcrypt.compare(currentPassword, db.passwordHash);
    if (!ok) throw new BadRequestException({ message: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      entityType: 'User',
      entityId: user.id,
      action: 'PASSWORD_CHANGED',
      performedById: user.id,
    });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      const minutes = Number(this.config.get('PASSWORD_RESET_EXPIRES_MINUTES') ?? 60);
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + minutes * 60_000),
        },
      });
      // In production this would be emailed. Returned only in development for demo.
      if (this.config.get('NODE_ENV') !== 'production') {
        return { success: true, resetToken: token };
      }
    }
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const row = await this.prisma.passwordReset.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException({ message: 'Reset link is invalid or expired', code: 'RESET_INVALID' });
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: await bcrypt.hash(newPassword, 12) },
      }),
      this.prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES') ?? '15m';
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES') ?? '7d';
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: accessExpires as never,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpires as never,
    });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.parseExpiry(refreshExpires, 7 * 86_400_000)),
      },
    });
    return { accessToken, refreshToken };
  }

  private toPublic(user: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    profileImage: string | null;
    departmentId: string | null;
    teamId: string | null;
    managerId: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    role: { id: string; name: string; description: string | null; permissions?: { permission: { code: string } }[] };
    department: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
  }) {
    return {
      id: user.id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profileImage: user.profileImage,
      departmentId: user.departmentId,
      teamId: user.teamId,
      managerId: user.managerId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      role: { id: user.role.id, name: user.role.name, description: user.role.description },
      department: user.department,
      team: user.team,
      permissions: user.role.permissions?.map((p) => p.permission.code) ?? [],
    };
  }
}
