import { Module } from '@nestjs/common';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldResolver } from './custom-field.resolver';

@Module({
  providers: [CustomFieldResolver, CustomFieldService],
  exports: [CustomFieldService],
})
export class CustomFieldModule {}
