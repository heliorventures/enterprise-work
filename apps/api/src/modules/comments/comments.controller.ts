import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService, CreateCommentDto } from './comments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('work-items/:id/comments')
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @Get()
  @RequirePermissions('WORK_VIEW')
  list(@Param('id') id: string) {
    return this.comments.list(id);
  }

  @Post()
  @RequirePermissions('COMMENT_CREATE')
  create(@Param('id') id: string, @Body() dto: CreateCommentDto, @CurrentUser() user: AuthUser) {
    return this.comments.create(id, dto.message, user);
  }
}
