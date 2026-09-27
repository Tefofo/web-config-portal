import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SitesService } from './sites.service';
import { UpdateSiteDto } from './dto/site.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequestUser } from '../common/types/request-context';
import { TenantGuard } from '../common/guards/tenant.guard';

/** Authenticated, tenant-scoped site editing for the portal. */
@ApiTags('sites')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller({ path: 'sites', version: '1' })
export class SitesController {
  constructor(private readonly service: SitesService) {}

  @Get('me')
  getMine(@CurrentUser() user: RequestUser) {
    return this.service.getForTenant(user);
  }

  @Roles(UserRole.ADMIN, UserRole.CONFIGURATION_MANAGER)
  @Put('me')
  updateMine(@CurrentUser() user: RequestUser, @Body() dto: UpdateSiteDto) {
    return this.service.update(user, dto);
  }
}

/**
 * Public, unauthenticated read for the site renderer. Separate controller so
 * the whole thing is @Public and lives under /public.
 */
@ApiTags('public-sites')
@Controller({ path: 'public/sites', version: '1' })
export class PublicSitesController {
  constructor(private readonly service: SitesService) {}

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.service.getPublicBySlug(slug);
  }
}
