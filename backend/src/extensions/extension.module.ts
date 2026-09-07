import { Global, Module } from '@nestjs/common';
import { ExtensionRegistry } from './extension.registry';

@Global()
@Module({
  providers: [ExtensionRegistry],
  exports: [ExtensionRegistry],
})
export class ExtensionModule {}
