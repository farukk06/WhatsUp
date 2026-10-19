import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.module';
import { UsersService } from '../users/users.module';
import { hashPassword, verifyPassword } from './password';
import { LoginDto, RegisterDto } from './auth.dto';
const digest = (token: string) =>
  createHash('sha256').update(token).digest('hex');
@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const passwordHash = await hashPassword(dto.password);
    try {
      return await this.db.$transaction(async (tx) => {
        const user = await this.users.create(
          dto.email,
          dto.displayName,
          passwordHash,
          tx,
        );
        return this.issue(user.id, tx);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email already registered');
      throw error;
    }
  }
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    // Perform the expensive operation for unknown accounts as well.
    const encoded =
      user?.passwordHash ??
      `scrypt$00000000000000000000000000000000$${'0'.repeat(128)}`;
    if (!(await verifyPassword(dto.password, encoded)) || !user)
      throw new UnauthorizedException('Invalid credentials');
    return this.issue(user.id);
  }
  private async issue(userId: string, tx: Prisma.TransactionClient = this.db) {
    const refreshToken = randomBytes(48).toString('hex');
    const session = await tx.session.create({
      data: {
        userId,
        refreshHash: digest(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    return this.tokens(userId, session.id, refreshToken);
  }
  private async tokens(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ) {
    return {
      accessToken: await this.jwt.signAsync({ sub: userId, sid: sessionId }),
      refreshToken,
      expiresIn: 900,
    };
  }
  async refresh(refreshToken: string) {
    const refreshHash = digest(refreshToken);
    const session = await this.db.session.findUnique({
      where: { refreshHash },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      throw new UnauthorizedException('Invalid session');
    const replacement = randomBytes(48).toString('hex');
    // Compare-and-swap: two concurrent refreshes cannot both consume the same token.
    const result = await this.db.session.updateMany({
      where: {
        id: session.id,
        refreshHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { refreshHash: digest(replacement) },
    });
    if (result.count !== 1) throw new UnauthorizedException('Invalid session');
    return this.tokens(session.userId, session.id, replacement);
  }
  async logout(refreshToken: string) {
    await this.db.session.updateMany({
      where: { refreshHash: digest(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
  async verifyAccessToken(token: string) {
    let claims: { sub: string; sid: string };
    try {
      claims = await this.jwt.verifyAsync(token, {
        algorithms: ['HS256'],
        issuer: 'whatsup-api',
        audience: 'whatsup',
      });
      if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string')
        throw new Error();
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
    const session = await this.db.session.findFirst({
      where: {
        id: claims.sid,
        userId: claims.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) throw new UnauthorizedException('Invalid session');
    return { id: session.userId, sessionId: session.id };
  }
}
