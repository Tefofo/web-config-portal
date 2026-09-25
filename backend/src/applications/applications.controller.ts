import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
import { CreateApiKeyDto } from '../api-keys/dto/api-key.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-context';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller({ path: 'applications', version: '1' })
export class ApplicationsController {
  constructor(
    private readonly service: ApplicationsService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.get(user, id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateApplicationDto) {
    return this.service.create(user, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  // --- API keys (scoped to an application) ---

  @Get(':id/api-keys')
  listKeys(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.apiKeys.listForApplication(user, id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/api-keys')
  createKey(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeys.create(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/api-keys/:keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeKey(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('keyId') keyId: string,
  ) {
    return this.apiKeys.revoke(user, id, keyId);
  }
}
