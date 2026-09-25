export type ApplicationStatus = 'ACTIVE' | 'INACTIVE';

export interface Application {
  id: string;
  tenantId: string;
  environmentId: string;
  name: string;
  code: string;
  description?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating an application (ADMIN only on the backend). */
export interface CreateApplicationRequest {
  name: string;
  code: string;
  environmentId: string;
  description?: string;
  status?: ApplicationStatus;
}

/** Partial update; code and environment are immutable after creation. */
export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  status?: ApplicationStatus;
}
