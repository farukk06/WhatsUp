import type { Socket } from 'socket.io';

export type RealtimeSocketUser = {
  id: string;
};

export type RealtimeSocketData = {
  user?: RealtimeSocketUser;
};

export type RealtimeSocket = Socket & {
  data: RealtimeSocketData;
};
