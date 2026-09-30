import { IsOptional, IsString } from 'class-validator';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export class DepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  headId?: string;
}

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.department.findMany({
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { users: true, teams: true, workItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        teams: { include: { _count: { select: { members: true } } } },
      },
    });
    if (!row) throw new NotFoundException({ message: 'Department not found', code: 'DEPARTMENT_NOT_FOUND' });
    return row;
  }

  create(dto: DepartmentDto) {
    if (!dto.name) throw new BadRequestException({ message: 'Name is required', code: 'VALIDATION' });
    return this.prisma.department.create({ data: { name: dto.name, description: dto.description, headId: dto.headId } });
  }

  async update(id: string, dto: Partial<DepartmentDto>) {
    await this.get(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}
