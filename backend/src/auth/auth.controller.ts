import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService, AuthResult } from './auth.service';
import { LoginDto, RefreshDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';
import { AuditService } from '../audit/audit.service';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditService,
  ) {}

  // Stricter rate limit on auth endpoints to blunt brute-force attempts.
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResult> {
    const result = await this.auth.validateAndLogin(dto.email, dto.password);
    if (result.user.tenantId) {
      await this.audit.record({
        tenantId: result.user.tenantId,
        userId: result.user.id,
        action: 'LOGIN',
        entity: 'AUTH',
        description: 'User signed in.',
      });
    }
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthResult> {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: RequestUser): Promise<{ success: boolean }> {
    if (user.tenantId) {
      await this.audit.record({
        tenantId: user.tenantId,
        userId: user.userId,
        action: 'LOGOUT',
        entity: 'AUTH',
        description: 'User signed out.',
      });
    }
    // With stateless JWTs the client discards tokens; server records the event.
    return { success: true };
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: RequestUser): Promise<AuthResult['user']> {
    return this.auth.me(user.userId);
  }
}
