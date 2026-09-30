import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  };
  const audit = { record: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token'), verifyAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: (k: string) => (k.includes('SECRET') ? 'secret-secret-secret-secret-1234' : '15m') },
        },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects unknown users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('x@y.z', 'password1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues tokens on valid login', async () => {
    const hash = await bcrypt.hash('Welcome123!', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'vinay.phadnis@solvian.local',
      passwordHash: hash,
      status: 'ACTIVE',
      role: { name: 'VP', id: 'r', description: '', permissions: [] },
      department: null,
      team: null,
      employeeId: 'E',
      firstName: 'E',
      lastName: 'V',
      profileImage: null,
      departmentId: null,
      teamId: null,
      managerId: null,
      lastLoginAt: null,
      createdAt: new Date(),
    });
    prisma.user.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    const result = await service.login('vinay.phadnis@solvian.local', 'Welcome123!');
    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('vinay.phadnis@solvian.local');
  });
});
