import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/modules/database/database.module';
import {
  RealtimeGateway,
  conversationRoom,
} from '../src/modules/realtime/realtime.gateway';
import { AuthService } from '../src/modules/auth/auth.service';
import type { ConversationJoinAck } from '@whatsup/shared';

describe('Week 1 real database + HTTP + Socket.IO', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let url: string;
  let member: { accessToken: string; refreshToken: string };
  let outsider: typeof member;
  let memberId: string;
  const conversationId = randomUUID();
  const email = `week1-${randomUUID()}@example.test`;
  const outsiderEmail = `week1-${randomUUID()}@example.test`;
  const password = 'Week1-Integration-Password!';
  const sockets: Socket[] = [];
  async function connect(token?: unknown): Promise<Socket> {
    const socket = io(`${url}/chat`, {
      auth: token === undefined ? {} : { token, userId: 'forged' },
      transports: ['websocket'],
      reconnection: false,
      timeout: 3000,
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      socket.once('connect', () => resolve(socket));
      socket.once('connect_error', reject);
    });
  }
  const action = (
    socket: Socket,
    event: string,
    payload: unknown,
  ): Promise<ConversationJoinAck> =>
    new Promise((resolve, reject) => {
      socket
        .timeout(3000)
        .emit(
          event,
          payload,
          (error: Error | null, ack: ConversationJoinAck) =>
            error ? reject(error) : resolve(ack),
        );
    });
  jest.setTimeout(20000);
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
    db = app.get(DatabaseService);
  });
  afterAll(async () => {
    for (const socket of sockets) socket.disconnect();
    if (db) {
      await db.conversation.deleteMany({ where: { id: conversationId } });
      await db.user.deleteMany({
        where: { email: { in: [email, outsiderEmail] } },
      });
    }
    if (app) await app.close();
  });
  it('registers, normalizes email, rejects duplicates/bad credentials/invalid DTOs', async () => {
    const result = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: email.toUpperCase(), password, displayName: 'Member' })
      .expect(201);
    member = result.body;
    expect(member.accessToken).toEqual(expect.any(String));
    expect(result.body.passwordHash).toBeUndefined();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, displayName: 'Duplicate' })
      .expect(409);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password-long' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: outsiderEmail, password })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'bad', password: 'short', displayName: ' ' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, userId: 'forged' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    outsider = (
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: outsiderEmail, password, displayName: 'Outsider' })
        .expect(201)
    ).body;
    memberId = (await db.user.findUniqueOrThrow({ where: { email } })).id;
    await db.conversation.create({
      data: { id: conversationId, members: { create: { userId: memberId } } },
    });
  });
  it('rejects missing, malformed, fake, expired, wrong-audience and revoked-session access tokens at handshake', async () => {
    const identity = await app
      .get(AuthService)
      .verifyAccessToken(member.accessToken);
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET });
    const expired = jwt.sign(
      { sub: memberId, sid: identity.sessionId },
      { expiresIn: -1, issuer: 'whatsup-api', audience: 'whatsup' },
    );
    const wrongAudience = jwt.sign(
      { sub: memberId, sid: identity.sessionId },
      { expiresIn: 60, issuer: 'whatsup-api', audience: 'other' },
    );
    for (const token of [undefined, '', 123, 'fake', expired, wrongAudience])
      await expect(connect(token)).rejects.toThrow('UNAUTHORIZED');
    const revoked = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
    ).body;
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: revoked.refreshToken })
      .expect(201);
    await expect(connect(revoked.accessToken)).rejects.toThrow('UNAUTHORIZED');
  });
  it('derives identity on server and allows member join/leave using shared ACKs', async () => {
    const socket = await connect(member.accessToken);
    const namespace = app.get(RealtimeGateway).namespace;
    const serverSocket = namespace.sockets.get(socket.id!);
    expect(serverSocket?.data.user.id).toBe(memberId);
    expect(serverSocket?.data.user.id).not.toBe('forged');
    expect(
      await action(socket, 'conversation:join', { conversationId }),
    ).toEqual({ ok: true, data: { conversationId, joined: true } });
    expect(serverSocket?.rooms.has(conversationRoom(conversationId))).toBe(
      true,
    );
    expect(
      await action(socket, 'conversation:leave', { conversationId }),
    ).toEqual({ ok: true, data: { conversationId, left: true } });
    expect(serverSocket?.rooms.has(conversationRoom(conversationId))).toBe(
      false,
    );
    expect(
      (await app.get(AuthService).verifyAccessToken(member.accessToken)).id,
    ).toBe(memberId);
    socket.disconnect();
  });
  it.each(['access expiry', 'session expiry', 'session revocation'] as const)(
    'keeps idle room state but rejects the next packet after %s',
    async (reason) => {
      const pair = (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password })
          .expect(201)
      ).body;
      const auth = app.get(AuthService);
      const identity = await auth.verifyAccessToken(pair.accessToken);
      const accessToken =
        reason === 'access expiry'
          ? new JwtService({ secret: process.env.JWT_ACCESS_SECRET }).sign(
              { sub: identity.id, sid: identity.sessionId },
              { expiresIn: 5, issuer: 'whatsup-api', audience: 'whatsup' },
            )
          : pair.accessToken;
      const socket = await connect(accessToken);
      const serverSocket = app
        .get(RealtimeGateway)
        .namespace.sockets.get(socket.id!)!;
      expect(
        (await action(socket, 'conversation:join', { conversationId })).ok,
      ).toBe(true);
      try {
        if (reason === 'access expiry') {
          const claims = new JwtService().decode(accessToken) as {
            exp: number;
          };
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              Math.max(0, claims.exp * 1000 - Date.now() + 50),
            ),
          );
        } else {
          await db.session.update({
            where: { id: identity.sessionId },
            data:
              reason === 'session expiry'
                ? { expiresAt: new Date(0) }
                : { revokedAt: new Date() },
          });
        }
        // No polling/eviction exists: idle room presence alone is not delivery authorization.
        expect(socket.connected).toBe(true);
        expect(serverSocket.rooms.has(conversationRoom(conversationId))).toBe(
          true,
        );
        await expect(auth.verifyAccessToken(accessToken)).rejects.toThrow();
        const disconnected = new Promise<void>((resolve) =>
          socket.once('disconnect', () => resolve()),
        );
        // Even an unknown inbound event is stopped by session middleware.
        socket.emit('closure:unauthorized-probe');
        await disconnected;
        expect(serverSocket.connected).toBe(false);
        expect(serverSocket.rooms.has(conversationRoom(conversationId))).toBe(
          false,
        );
      } finally {
        socket.disconnect();
      }
    },
  );
  it('denies nonmembers/unknown IDs/identity injection and rechecks membership after join', async () => {
    const socket = await connect(outsider.accessToken);
    for (const id of [conversationId, randomUUID()])
      expect(
        await action(socket, 'conversation:join', { conversationId: id }),
      ).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    for (const payload of [
      null,
      {},
      { conversationId: '../private' },
      { conversationId, userId: memberId },
    ])
      expect(await action(socket, 'conversation:join', payload)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_PAYLOAD' },
      });
    expect(
      await action(socket, 'conversation:leave', { conversationId }),
    ).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(
      app
        .get(RealtimeGateway)
        .namespace.sockets.get(socket.id!)
        ?.rooms.has(conversationRoom(conversationId)),
    ).toBe(false);
    const authorized = await connect(member.accessToken);
    expect(
      (await action(authorized, 'conversation:join', { conversationId })).ok,
    ).toBe(true);
    await db.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId: memberId } },
    });
    // An idle socket retains the stale room until its next protected action.
    expect(authorized.connected).toBe(true);
    expect(
      app
        .get(RealtimeGateway)
        .namespace.sockets.get(authorized.id!)
        ?.rooms.has(conversationRoom(conversationId)),
    ).toBe(true);
    for (const event of ['conversation:join', 'conversation:leave'])
      expect(await action(authorized, event, { conversationId })).toMatchObject(
        { ok: false, error: { code: 'FORBIDDEN' } },
      );
    expect(
      app
        .get(RealtimeGateway)
        .namespace.sockets.get(authorized.id!)
        ?.rooms.has(conversationRoom(conversationId)),
    ).toBe(false);
    expect(conversationRoom(conversationId)).toBe(
      `conversation:${conversationId}`,
    );
  });
  it('rejects expired sessions at API and socket boundaries', async () => {
    const expired = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
    ).body;
    const identity = await app
      .get(AuthService)
      .verifyAccessToken(expired.accessToken);
    await db.session.update({
      where: { id: identity.sessionId },
      data: { expiresAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: expired.refreshToken })
      .expect(401);
    await expect(
      app.get(AuthService).verifyAccessToken(expired.accessToken),
    ).rejects.toThrow();
    await expect(connect(expired.accessToken)).rejects.toThrow('UNAUTHORIZED');
  });
  it('rotates refresh tokens atomically and invalidates connected sockets on next action after logout', async () => {
    const socket = await connect(member.accessToken);
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: member.refreshToken }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([201, 401]);
    const current = responses.find((r) => r.status === 201)!.body;
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: member.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: '0'.repeat(96) })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'bad' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: current.refreshToken })
      .expect(201);
    await expect(
      app.get(AuthService).verifyAccessToken(current.accessToken),
    ).rejects.toThrow();
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: current.refreshToken })
      .expect(401);
    expect(socket.connected).toBe(true); // Logout is not proactive socket eviction.
    const disconnected = new Promise((resolve) =>
      socket.once('disconnect', resolve),
    );
    socket.emit('conversation:join', { conversationId });
    await disconnected;
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: current.refreshToken })
      .expect(201);
  });
});
