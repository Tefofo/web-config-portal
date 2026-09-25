import { Injectable } from '@nestjs/common';
import { ConfigurationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ApiKeyContext } from '../common/types/request-context';

export interface RuntimeConfigResponse {
  environment: string;
  application: string;
  configurations: Record<string, unknown>;
}

@Injectable()
export class RuntimeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns active configurations for the tenant + environment tied to the
   * API key. Scoped strictly by tenantId and environmentId from the key
   * context, so a key can never read another tenant's data.
   */
  async getConfig(context: ApiKeyContext): Promise<RuntimeConfigResponse> {
    const [environment, application, configs] = await Promise.all([
      this.prisma.environment.findFirst({
        where: { id: context.environmentId, tenantId: context.tenantId },
      }),
      this.prisma.application.findFirst({
        where: { id: context.applicationId, tenantId: context.tenantId },
      }),
      this.prisma.configuration.findMany({
        where: {
          tenantId: context.tenantId,
          environmentId: context.environmentId,
          status: ConfigurationStatus.ACTIVE,
        },
      }),
    ]);

    const configurations: Record<string, unknown> = {};
    for (const config of configs) {
      configurations[config.key] = config.value;
    }

    return {
      environment: environment?.code ?? 'unknown',
      application: application?.code ?? 'unknown',
      configurations,
    };
  }
}
