import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeamDto, TeamsService } from './teams.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private teams: TeamsService) {}

  @Get()
  @RequirePermissions('TEAM_VIEW')
  list(@Query('departmentId') departmentId?: string) {
    return this.teams.list(departmentId);
  }

  @Get(':id')
  @RequirePermissions('TEAM_VIEW')
  get(@Param('id') id: string) {
    return this.teams.get(id);
  }

  @Post()
  @RequirePermissions('TEAM_MANAGE')
  create(@Body() dto: TeamDto) {
    return this.teams.create(dto);
  }

  @Put(':id')
  @RequirePermissions('TEAM_MANAGE')
  update(@Param('id') id: string, @Body() dto: Partial<TeamDto>) {
    return this.teams.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('TEAM_MANAGE')
  remove(@Param('id') id: string) {
    return this.teams.remove(id);
  }
}
