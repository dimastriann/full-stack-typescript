import { Module } from '@nestjs/common';
import { BaseService } from './base.service';
import { BaseResolver } from './base.resolver';

@Module({
  providers: [BaseResolver, BaseService],
})
export class BaseModule {}
