import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DepartmentDto, DepartmentsService } from './departments.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private departments: DepartmentsService) {}

  @Get()
  @RequirePermissions('DEPARTMENT_VIEW')
  list() {
    return this.departments.list();
  }

  @Get(':id')
  @RequirePermissions('DEPARTMENT_VIEW')
  get(@Param('id') id: string) {
    return this.departments.get(id);
  }

  @Post()
  @RequirePermissions('DEPARTMENT_MANAGE')
  create(@Body() dto: DepartmentDto) {
    return this.departments.create(dto);
  }

  @Put(':id')
  @RequirePermissions('DEPARTMENT_MANAGE')
  update(@Param('id') id: string, @Body() dto: Partial<DepartmentDto>) {
    return this.departments.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('DEPARTMENT_MANAGE')
  remove(@Param('id') id: string) {
    return this.departments.remove(id);
  }
}
