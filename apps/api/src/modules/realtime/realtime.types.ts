import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@whatsup/shared';
export type RealtimeSocketUser = { id: string; sessionId: string };
export type RealtimeSocketData = { user?: RealtimeSocketUser };
export type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  RealtimeSocketData
>;
