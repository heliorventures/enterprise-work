import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto, TasksService, UpdateTaskDto } from './tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  @RequirePermissions('TASK_VIEW')
  list(@Query('workItemId') workItemId?: string, @Query('assignedToId') assignedToId?: string) {
    return this.tasks.list(workItemId, assignedToId);
  }

  @Post()
  @RequirePermissions('TASK_CREATE')
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.create(dto, user);
  }

  @Put(':id')
  @RequirePermissions('TASK_UPDATE')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('TASK_DELETE')
  remove(@Param('id') id: string) {
    return this.tasks.remove(id);
  }
}
