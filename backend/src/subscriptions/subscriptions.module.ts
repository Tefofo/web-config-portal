import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, BillingService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
