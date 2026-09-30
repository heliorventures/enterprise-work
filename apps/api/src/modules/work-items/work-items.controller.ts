import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkPriority, WorkStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkItemsService } from './work-items.service';
import { CreateWorkItemDto, SavedFilterDto, UpdateWorkItemDto } from './dto/work-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

class WorkQuery extends PaginationQueryDto {
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
  managerId?: string;
  @IsOptional()
  @IsString()
  processId?: string;
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;
  @IsOptional()
  @IsEnum(WorkPriority)
  priority?: WorkPriority;
  @IsOptional()
  @IsString()
  outcome?: string;
  @IsOptional()
  @IsString()
  from?: string;
  @IsOptional()
  @IsString()
  to?: string;
  @IsOptional()
  @IsString()
  overdue?: string;
  @IsOptional()
  @IsString()
  blocked?: string;
  @IsOptional()
  @IsString()
  mine?: string;
}

@ApiTags('work-items')
@ApiBearerAuth()
@Controller('work-items')
export class WorkItemsController {
  constructor(private work: WorkItemsService) {}

  @Get()
  @RequirePermissions('WORK_VIEW')
  list(@CurrentUser() user: AuthUser, @Query() q: WorkQuery) {
    return this.work.list(user, q);
  }

  @Get('filters')
  @RequirePermissions('WORK_VIEW')
  filters(@CurrentUser() user: AuthUser) {
    return this.work.savedFilters(user);
  }

  @Post('filters')
  @RequirePermissions('WORK_VIEW')
  saveFilter(@CurrentUser() user: AuthUser, @Body() dto: SavedFilterDto) {
    return this.work.saveFilter(user, dto.name, dto.filters ?? {});
  }

  @Delete('filters/:id')
  @RequirePermissions('WORK_VIEW')
  deleteFilter(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.work.deleteFilter(id, user);
  }

  @Get(':id')
  @RequirePermissions('WORK_VIEW')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.work.get(id, user);
  }

  @Post()
  @RequirePermissions('WORK_CREATE')
  create(@Body() dto: CreateWorkItemDto, @CurrentUser() user: AuthUser) {
    return this.work.create(dto, user);
  }

  @Put(':id')
  @RequirePermissions('WORK_UPDATE')
  update(@Param('id') id: string, @Body() dto: UpdateWorkItemDto, @CurrentUser() user: AuthUser) {
    return this.work.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('WORK_DELETE')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.work.remove(id, user);
  }
}
