import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';
import { TenantGuard, requireTenant } from '../common/guards/tenant.guard';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: AuditQueryDto) {
    return this.audit.list(requireTenant(user), query);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.audit.getById(requireTenant(user), id);
  }
}
