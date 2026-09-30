import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProcessDto, ProcessesService } from './processes.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('processes')
@ApiBearerAuth()
@Controller('processes')
export class ProcessesController {
  constructor(private processes: ProcessesService) {}

  @Get()
  @RequirePermissions('PROCESS_VIEW')
  list(@Query('active') active?: string) {
    return this.processes.list(active === 'true');
  }

  @Get(':id/analytics')
  @RequirePermissions('PROCESS_VIEW')
  analytics(@Param('id') id: string) {
    return this.processes.analytics(id);
  }

  @Get(':id')
  @RequirePermissions('PROCESS_VIEW')
  get(@Param('id') id: string) {
    return this.processes.get(id);
  }

  @Post()
  @RequirePermissions('PROCESS_CREATE')
  create(@Body() dto: ProcessDto) {
    return this.processes.create(dto);
  }

  @Put(':id')
  @RequirePermissions('PROCESS_UPDATE')
  update(@Param('id') id: string, @Body() dto: Partial<ProcessDto>) {
    return this.processes.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PROCESS_DELETE')
  remove(@Param('id') id: string) {
    return this.processes.remove(id);
  }
}
