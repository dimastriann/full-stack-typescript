import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PubSub } from 'graphql-subscriptions';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [
    ChatService,
    ChatResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [ChatService, 'PUB_SUB'],
})
export class ChatModule {}
