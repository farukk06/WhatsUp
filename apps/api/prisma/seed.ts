import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password';
const db = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Synthetic seed is forbidden in production');
  const passwordHash = await hashPassword('Synthetic-Week1-Password!');
  await db.$transaction(async (tx) => {
    for (const [index, name] of ['alice', 'bob', 'outsider'].entries()) {
      await tx.user.upsert({
        where: { id: `00000000-0000-4000-8000-00000000000${index + 1}` },
        update: {},
        create: {
          id: `00000000-0000-4000-8000-00000000000${index + 1}`,
          email: `${name}@example.test`,
          displayName: name,
          passwordHash,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      });
    }
    const conversationId = '10000000-0000-4000-8000-000000000001';
    await tx.conversation.upsert({
      where: { id: conversationId },
      update: {},
      create: {
        id: conversationId,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    });
    for (const n of [1, 2]) {
      const userId = `00000000-0000-4000-8000-00000000000${n}`;
      await tx.conversationMember.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        update: {},
        create: {
          conversationId,
          userId,
          joinedAt: new Date('2026-01-01T00:00:00Z'),
        },
      });
    }
  });
}
main().finally(() => db.$disconnect());
