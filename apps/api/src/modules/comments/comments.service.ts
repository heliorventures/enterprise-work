import { IsString, MaxLength } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

export class CreateCommentDto {
  @IsString()
  @MaxLength(4000)
  message!: string;
}

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private events: EventsGateway,
    private notifications: NotificationsService,
  ) {}

  list(workItemId: string) {
    return this.prisma.comment.findMany({
      where: { workItemId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(workItemId: string, message: string, user: AuthUser) {
    const comment = await this.prisma.comment.create({
      data: { workItemId, userId: user.id, message },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    await this.audit.record({
      entityType: 'Comment',
      entityId: workItemId,
      action: 'COMMENT_ADDED',
      performedById: user.id,
      newValue: { preview: message.slice(0, 80) },
    });
    const mentions = [...message.matchAll(/@([a-z0-9._-]+@[a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase());
    if (mentions.length) {
      const users = await this.prisma.user.findMany({ where: { email: { in: mentions } } });
      for (const u of users) {
        await this.notifications.notify({
          userId: u.id,
          title: 'Mention',
          message: `You were mentioned in a comment.`,
          type: 'MENTION',
          workItemId,
        });
      }
    }
    this.events.emitToWork(workItemId, 'comment.created', comment);
    return comment;
  }
}
