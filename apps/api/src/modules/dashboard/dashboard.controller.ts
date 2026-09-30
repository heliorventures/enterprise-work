import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

class DashQuery {
  @IsOptional()
  @IsString()
  from?: string;
  @IsOptional()
  @IsString()
  to?: string;
  @IsOptional()
  @IsString()
  departmentId?: string;
  @IsOptional()
  @IsString()
  teamId?: string;
  @IsOptional()
  @IsString()
  managerId?: string;
  @IsOptional()
  @IsString()
  employeeId?: string;
  @IsOptional()
  @IsString()
  processId?: string;
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;
  @IsOptional()
  @IsString()
  priority?: string;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('executive')
  @RequirePermissions('DASHBOARD_VIEW')
  executive(@CurrentUser() user: AuthUser, @Query() q: DashQuery) {
    return this.dashboard.executive(user, q);
  }

  @Get('manager')
  @RequirePermissions('DASHBOARD_VIEW')
  manager(@CurrentUser() user: AuthUser, @Query() q: DashQuery) {
    return this.dashboard.manager(user, q);
  }

  @Get('employee')
  @RequirePermissions('DASHBOARD_VIEW')
  employee(@CurrentUser() user: AuthUser) {
    return this.dashboard.employee(user);
  }

  @Get('resources')
  @RequirePermissions('DASHBOARD_VIEW')
  resources(@CurrentUser() user: AuthUser, @Query() q: DashQuery) {
    return this.dashboard.resources(user, q);
  }

  @Get('employees/:id')
  @RequirePermissions('DASHBOARD_VIEW')
  profile(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dashboard.employeeProfile(id, user);
  }
}
