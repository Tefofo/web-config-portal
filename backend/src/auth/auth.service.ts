import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { TenantStatus, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { RequestUser } from '../common/types/request-context';

/** The subset of jsonwebtoken's expiresIn we use (e.g. '900s', '7d', 3600). */
type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateAndLogin(email: string, password: string): Promise<AuthResult> {
    // Do not reveal whether the email exists — use a generic error.
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.assertUsable(user);

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.prisma.user.findFirst({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    await this.assertUsable(user);
    return this.issueTokens(user);
  }

  async me(userId: string): Promise<AuthResult['user']> {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.toPublicUser(user);
  }

  /** Verifies the user is active and (if applicable) their tenant is usable. */
  private async assertUsable(user: User): Promise<void> {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active.');
    }
    if (user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
      if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
        throw new UnauthorizedException('Your organization account is not active.');
      }
    }
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    // jsonwebtoken types expiresIn as a template-literal `StringValue | number`;
    // our env values are plain strings, so narrow via the exported type.
    const accessTtl = (this.config.get<string>('jwt.accessTtl') ?? '900s') as JwtExpiresIn;
    const refreshTtl = (this.config.get<string>('jwt.refreshTtl') ?? '7d') as JwtExpiresIn;

    const accessOptions: JwtSignOptions = {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: accessTtl,
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: refreshTtl,
    };
    const accessToken = await this.jwt.signAsync(payload, accessOptions);
    const refreshToken = await this.jwt.signAsync(payload, refreshOptions);

    return { accessToken, refreshToken, user: this.toPublicUser(user) };
  }

  private toPublicUser(user: User): AuthResult['user'] {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  toRequestUser(user: User): RequestUser {
    return {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };
  }
}
