import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../events/events.gateway';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async notify(params: {
    userId: string;
    title: string;
    message: string;
    type: string;
    workItemId?: string;
  }) {
    const row = await this.prisma.notification.create({ data: params });
    this.events.emitToUser(params.userId, 'notification.created', row);
    return row;
  }

  list(user: AuthUser, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
      include: { workItem: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(user: AuthUser) {
    return this.prisma.notification.count({ where: { userId: user.id, read: false } });
  }

  async markRead(id: string, user: AuthUser) {
    await this.prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
    return { success: true };
  }

  async markAll(user: AuthUser) {
    await this.prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    return { success: true };
  }
}
