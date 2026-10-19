import { Injectable, Module } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DatabaseModule, DatabaseService } from '../database/database.module';
@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}
  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }
  create(
    email: string,
    displayName: string,
    passwordHash: string,
    tx?: Prisma.TransactionClient,
  ) {
    return (tx ?? this.db).user.create({
      data: { email, displayName, passwordHash },
    });
  }
}
@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
