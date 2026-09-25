import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RuntimeService, RuntimeConfigResponse } from './runtime.service';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentApiKey } from '../common/decorators/api-key-context.decorator';
import { ApiKeyContext } from '../common/types/request-context';

/**
 * Runtime configuration API for customer applications. Authenticated by an
 * application API key (Bearer), NOT a user JWT. @Public() bypasses the global
 * JWT guard; ApiKeyGuard enforces key auth instead.
 */
@ApiTags('runtime')
@ApiSecurity('api-key')
@Controller({ path: 'runtime', version: '1' })
export class RuntimeController {
  constructor(private readonly runtime: RuntimeService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get('config')
  getConfig(@CurrentApiKey() context: ApiKeyContext): Promise<RuntimeConfigResponse> {
    return this.runtime.getConfig(context);
  }
}
