import { IsOptional, IsString } from 'class-validator';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export class TeamDto {
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
  leadId?: string;
}

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  list(departmentId?: string) {
    return this.prisma.team.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true, workItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.team.findUnique({
      where: { id },
      include: {
        department: true,
        lead: { select: { id: true, firstName: true, lastName: true } },
        members: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
      },
    });
    if (!row) throw new NotFoundException({ message: 'Team not found', code: 'TEAM_NOT_FOUND' });
    return row;
  }

  create(dto: TeamDto) {
    if (!dto.name || !dto.departmentId) {
      throw new BadRequestException({ message: 'Name and department are required', code: 'VALIDATION' });
    }
    return this.prisma.team.create({
      data: { name: dto.name, description: dto.description, departmentId: dto.departmentId, leadId: dto.leadId },
    });
  }

  async update(id: string, dto: Partial<TeamDto>) {
    await this.get(id);
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.team.delete({ where: { id } });
    return { success: true };
  }
}
