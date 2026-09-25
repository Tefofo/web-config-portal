import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { UsageService } from '../usage/usage.service';
import { RequestUpgradeDto } from './dto/upgrade.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-context';
import { TenantGuard, requireTenant } from '../common/guards/tenant.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(
    private readonly service: SubscriptionsService,
    private readonly usage: UsageService,
  ) {}

  @Get('current')
  current(@CurrentUser() user: RequestUser) {
    return this.service.current(requireTenant(user));
  }

  @Get('usage')
  usageSnapshot(@CurrentUser() user: RequestUser) {
    return this.usage.snapshot(requireTenant(user));
  }

  @Roles(UserRole.ADMIN)
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  requestUpgrade(@CurrentUser() user: RequestUser, @Body() dto: RequestUpgradeDto) {
    return this.service.requestUpgrade(requireTenant(user), user.userId, dto.targetPlan);
  }
}
