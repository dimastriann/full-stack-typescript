import { Module } from '@nestjs/common';
import {
  InjectRedis,
  RedisModule as IoRedisModule,
} from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export { InjectRedis, Redis };

@Module({
  imports: [
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}`,
        options: {
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
  ],
  exports: [IoRedisModule],
})
export class RedisModule {}
