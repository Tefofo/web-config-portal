import { UserRole } from '@prisma/client';

/**
 * The authenticated principal attached to each request after JWT validation.
 * tenantId is null only for PLATFORM_ADMIN users who operate above tenants.
 */
export interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  email: string;
}

/** For runtime (API-key) authenticated requests. */
export interface ApiKeyContext {
  tenantId: string;
  applicationId: string;
  environmentId: string;
  apiKeyId: string;
}
