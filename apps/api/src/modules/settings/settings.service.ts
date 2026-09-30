import { IsString } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export class SettingDto {
  @IsString()
  key!: string;
  value!: Prisma.InputJsonValue;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsert(key: string, value: Prisma.InputJsonValue) {
    return this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  statuses() {
    return this.prisma.workStatusDefinition.findMany({ orderBy: { sortOrder: 'asc' } });
  }
}
