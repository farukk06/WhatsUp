import type { RealtimeSocketUser } from './realtime.types';

export abstract class RealtimeAuthPort {
  abstract verifyAccessToken(token: string): Promise<RealtimeSocketUser>;
}
