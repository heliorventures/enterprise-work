import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OutcomesService, UpsertOutcomeDto } from './outcomes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('outcomes')
@ApiBearerAuth()
@Controller('work-items/:id/outcome')
export class OutcomesController {
  constructor(private outcomes: OutcomesService) {}

  @Get()
  @RequirePermissions('OUTCOME_VIEW')
  get(@Param('id') id: string) {
    return this.outcomes.get(id);
  }

  @Put()
  @RequirePermissions('OUTCOME_CREATE')
  upsert(@Param('id') id: string, @Body() dto: UpsertOutcomeDto, @CurrentUser() user: AuthUser) {
    return this.outcomes.upsert(id, dto, user);
  }
}
