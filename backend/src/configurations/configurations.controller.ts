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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigurationStatus, UserRole } from '@prisma/client';
import { ConfigurationsService } from './configurations.service';
import {
  ConfigurationQueryDto,
  CreateConfigurationDto,
  DuplicateConfigurationDto,
  UpdateConfigurationDto,
} from './dto/configuration.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-context';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('configurations')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller({ path: 'configurations', version: '1' })
export class ConfigurationsController {
  constructor(private readonly service: ConfigurationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ConfigurationQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.get(user, id);
  }

  @Roles(UserRole.ADMIN, UserRole.CONFIGURATION_MANAGER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateConfigurationDto) {
    return this.service.create(user, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.CONFIGURATION_MANAGER)
  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateConfigurationDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  @Roles(UserRole.ADMIN, UserRole.CONFIGURATION_MANAGER)
  @Post(':id/enable')
  @HttpCode(HttpStatus.OK)
  enable(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.setStatus(user, id, ConfigurationStatus.ACTIVE);
  }

  @Roles(UserRole.ADMIN, UserRole.CONFIGURATION_MANAGER)
  @Post(':id/disable')
  @HttpCode(HttpStatus.OK)
  disable(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.setStatus(user, id, ConfigurationStatus.DISABLED);
  }

  @Roles(UserRole.ADMIN, UserRole.CONFIGURATION_MANAGER)
  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: DuplicateConfigurationDto,
  ) {
    return this.service.duplicate(user, id, dto);
  }
}
