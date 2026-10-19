import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace } from 'socket.io';
import type {
  ConversationJoinAck,
  ConversationLeaveAck,
} from '@whatsup/shared';
import { ConversationAuthorizationService } from '../conversations/conversations.module';
import { RealtimeAuthPort } from './realtime-auth.port';
import type { RealtimeSocket } from './realtime.types';
export const conversationRoom = (id: string) => `conversation:${id}`;
const validPayload = (value: unknown): value is { conversationId: string } => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 1 &&
    typeof record.conversationId === 'string' &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      record.conversationId,
    )
  );
};
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer() namespace: Namespace;
  constructor(
    private readonly auth: RealtimeAuthPort,
    private readonly conversations: ConversationAuthorizationService,
  ) {}
  afterInit(namespace: Namespace) {
    namespace.use((socket, next) => {
      const token: unknown = socket.handshake.auth?.token;
      if (typeof token !== 'string' || token.length > 4096 || !token)
        return next(new Error('UNAUTHORIZED'));
      this.auth
        .verifyAccessToken(token)
        .then((user) => {
          socket.data.user = user;
          // Revalidate session/expiry before every inbound event, including future handlers.
          socket.use((_packet, proceed) => {
            this.auth
              .verifyAccessToken(token)
              .then(() => proceed())
              .catch(() => socket.disconnect(true));
          });
          next();
        })
        .catch(() => next(new Error('UNAUTHORIZED')));
    });
  }
  @SubscribeMessage('conversation:join')
  join(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() payload: unknown,
  ): Promise<ConversationJoinAck> {
    return this.changeRoom(
      socket,
      payload,
      true,
    ) as Promise<ConversationJoinAck>;
  }
  @SubscribeMessage('conversation:leave')
  leave(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() payload: unknown,
  ): Promise<ConversationLeaveAck> {
    return this.changeRoom(
      socket,
      payload,
      false,
    ) as Promise<ConversationLeaveAck>;
  }
  private async changeRoom(
    socket: RealtimeSocket,
    payload: unknown,
    join: boolean,
  ): Promise<ConversationJoinAck | ConversationLeaveAck> {
    if (!validPayload(payload))
      return {
        ok: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Expected conversationId UUID only',
        },
      };
    const room = conversationRoom(payload.conversationId);
    try {
      if (!socket.data.user) throw new UnauthorizedException();
      await this.conversations.requireMember(
        payload.conversationId,
        socket.data.user.id,
      );
      if (join) await socket.join(room);
      else await socket.leave(room);
      return join
        ? {
            ok: true,
            data: { conversationId: payload.conversationId, joined: true },
          }
        : {
            ok: true,
            data: { conversationId: payload.conversationId, left: true },
          };
    } catch (error) {
      await socket.leave(room);
      if (error instanceof ForbiddenException)
        return {
          ok: false,
          error: { code: 'FORBIDDEN', message: 'Conversation access denied' },
        };
      if (error instanceof UnauthorizedException)
        return {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        };
      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to authorize conversation',
        },
      };
    }
  }
}
