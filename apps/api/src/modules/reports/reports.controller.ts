import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IsOptional, IsString } from 'class-validator';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { DashFilters } from '../dashboard/dashboard.service';

class ReportQuery implements DashFilters {
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
  employeeId?: string;
  @IsOptional()
  @IsString()
  processId?: string;
  @IsOptional()
  @IsString()
  format?: 'csv' | 'xlsx' | 'pdf';
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('work')
  @RequirePermissions('REPORT_VIEW')
  work(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.workSummary(user, q);
  }

  @Get('departments')
  @RequirePermissions('REPORT_VIEW')
  departments(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.departmentPerformance(user, q);
  }

  @Get('processes')
  @RequirePermissions('REPORT_VIEW')
  processes(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.processPerformance(user, q);
  }

  @Get('outcomes')
  @RequirePermissions('REPORT_VIEW')
  outcomes(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.outcomes(user, q);
  }

  @Get('overdue')
  @RequirePermissions('REPORT_VIEW')
  overdue(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.overdue(user, q);
  }

  @Get('trends')
  @RequirePermissions('REPORT_VIEW')
  trends(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.completionTrends(user, q);
  }

  @Get('resources')
  @RequirePermissions('REPORT_VIEW')
  async resources(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    return this.reports.workSummary(user, q);
  }

  @Get('export')
  @RequirePermissions('REPORT_VIEW')
  async export(@CurrentUser() user: AuthUser, @Query() q: ReportQuery, @Res() res: Response) {
    const format = q.format ?? 'csv';
    const file = await this.reports.export(user, q, format, 'work-report');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }
}
