import { ForbiddenException, Injectable, Module } from '@nestjs/common';
import { DatabaseModule, DatabaseService } from '../database/database.module';
@Injectable()
export class ConversationAuthorizationService {
  constructor(private readonly db: DatabaseService) {}
  async requireMember(conversationId: string, userId: string): Promise<void> {
    const member = await this.db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Conversation access denied');
  }
}
@Module({
  imports: [DatabaseModule],
  providers: [ConversationAuthorizationService],
  exports: [ConversationAuthorizationService],
})
export class ConversationsModule {}
