import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyContext } from '../types/request-context';

/** Injects the ApiKeyContext resolved by ApiKeyGuard. */
export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyContext => {
    const request = ctx.switchToHttp().getRequest<Request & { apiKey: ApiKeyContext }>();
    return request.apiKey;
  },
);
