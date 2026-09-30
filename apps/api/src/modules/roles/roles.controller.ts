import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService, UpdateRoleDto } from './roles.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@Controller()
export class RolesController {
  constructor(private roles: RolesService) {}

  @Get('roles')
  @RequirePermissions('ROLE_MANAGE')
  list() {
    return this.roles.list();
  }

  @Get('permissions')
  @RequirePermissions('ROLE_MANAGE')
  permissions() {
    return this.roles.permissions();
  }

  @Put('roles/:id')
  @RequirePermissions('ROLE_MANAGE')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }
}
