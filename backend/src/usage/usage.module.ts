import { Global, Module } from '@nestjs/common';
import { UsageService } from './usage.service';

/** Global so any module enforcing limits can inject UsageService. */
@Global()
@Module({
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
