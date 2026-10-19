import { ForbiddenException } from '@nestjs/common';
import { RealtimeGateway, conversationRoom } from './realtime.gateway';
import type { RealtimeSocket } from './realtime.types';
import type { RealtimeAuthPort } from './realtime-auth.port';
import type { ConversationAuthorizationService } from '../conversations/conversations.module';

describe('Realtime authorization failure boundaries', () => {
  const id = '10000000-0000-4000-8000-000000000001';
  const requireMember = jest.fn();
  const gateway = new RealtimeGateway(
    {} as RealtimeAuthPort,
    { requireMember } as unknown as ConversationAuthorizationService,
  );
  beforeEach(() => jest.resetAllMocks());
  function socket(user = true) {
    return {
      data: {
        user: user ? { id: 'verified', sessionId: 'session' } : undefined,
      },
      join: jest.fn(),
      leave: jest.fn(),
    };
  }
  it('rejects unauthenticated handler access before querying membership', async () => {
    const client = socket(false);
    expect(
      await gateway.join(client as unknown as RealtimeSocket, {
        conversationId: id,
      }),
    ).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
    expect(requireMember).not.toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });
  it.each([
    new ForbiddenException(),
    new Error('sensitive internal database details'),
  ])(
    'fails closed and removes stale room on authorization errors',
    async (error) => {
      requireMember.mockRejectedValue(error);
      const client = socket();
      const result = await gateway.join(client as unknown as RealtimeSocket, {
        conversationId: id,
      });
      expect(result).toMatchObject({
        ok: false,
        error: {
          code:
            error instanceof ForbiddenException
              ? 'FORBIDDEN'
              : 'INTERNAL_ERROR',
        },
      });
      expect(JSON.stringify(result)).not.toContain('sensitive');
      expect(requireMember).toHaveBeenCalledWith(id, 'verified');
      expect(client.join).not.toHaveBeenCalled();
      expect(client.leave).toHaveBeenCalledWith(conversationRoom(id));
    },
  );
});
