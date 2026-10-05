import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { RealtimeSocket } from './realtime.types';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  handleConnection(client: RealtimeSocket) {
    console.log(`[realtime] connected: ${client.id}`);
  }

  handleDisconnect(client: RealtimeSocket) {
    console.log(`[realtime] disconnected: ${client.id}`);
  }
}
