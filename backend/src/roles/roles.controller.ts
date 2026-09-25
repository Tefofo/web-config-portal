import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ROLE_DEFINITIONS, RoleDefinition } from './role-permissions';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  @Get()
  list(): RoleDefinition[] {
    return ROLE_DEFINITIONS;
  }
}
