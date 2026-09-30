import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingDto, SettingsService } from './settings.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  list() {
    return this.settings.list();
  }

  @Get('statuses')
  statuses() {
    return this.settings.statuses();
  }

  @Put()
  @RequirePermissions('SETTINGS_MANAGE')
  upsert(@Body() dto: SettingDto) {
    return this.settings.upsert(dto.key, dto.value);
  }
}
