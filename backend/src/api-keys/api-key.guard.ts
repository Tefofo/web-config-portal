import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyContext } from '../common/types/request-context';

/**
 * Authenticates runtime requests using an application API key supplied as a
 * Bearer token. Attaches the resolved ApiKeyContext to req.apiKey. This is
 * separate from user JWT auth — application-to-application access must never
 * use user tokens.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { apiKey?: ApiKeyContext }>();
    const header = request.headers['authorization'];
    if (!header || Array.isArray(header) || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing API key.');
    }
    const rawKey = header.slice('Bearer '.length).trim();
    request.apiKey = await this.apiKeys.resolve(rawKey);
    return true;
  }
}
