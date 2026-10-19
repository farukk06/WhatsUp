import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeAuthPort } from './realtime-auth.port';
@Module({
  imports: [AuthModule, ConversationsModule],
  providers: [
    RealtimeGateway,
    { provide: RealtimeAuthPort, useExisting: AuthService },
  ],
})
export class RealtimeModule {}
