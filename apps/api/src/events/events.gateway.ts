import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
@Injectable()
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization || '').replace('Bearer ', '');
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      this.logger.warn('Socket rejected');
      client.disconnect();
    }
  }

  @SubscribeMessage('work.subscribe')
  subscribeWork(@ConnectedSocket() client: Socket, @MessageBody() workItemId: string) {
    if (workItemId) client.join(`work:${workItemId}`);
  }

  @SubscribeMessage('work.unsubscribe')
  unsubscribeWork(@ConnectedSocket() client: Socket, @MessageBody() workItemId: string) {
    if (workItemId) client.leave(`work:${workItemId}`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToWork(workItemId: string, event: string, payload: unknown) {
    this.server.to(`work:${workItemId}`).emit(event, payload);
    this.server.emit(event, payload);
  }
}
