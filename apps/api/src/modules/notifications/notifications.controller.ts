import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  @RequirePermissions('NOTIFICATION_VIEW')
  list(@CurrentUser() user: AuthUser, @Query('unread') unread?: string) {
    return this.notifications.list(user, unread === 'true');
  }

  @Get('unread-count')
  @RequirePermissions('NOTIFICATION_VIEW')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user).then((count) => ({ count }));
  }

  @Post(':id/read')
  @RequirePermissions('NOTIFICATION_VIEW')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.markRead(id, user);
  }

  @Post('read-all')
  @RequirePermissions('NOTIFICATION_VIEW')
  markAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAll(user);
  }
}
