export type EnvironmentType = 'DEVELOPMENT' | 'TESTING' | 'STAGING' | 'PRODUCTION';

export type EnvironmentStatus = 'ACTIVE' | 'INACTIVE';

export interface Environment {
  id: string;
  name: string;
  code: string;
  type: EnvironmentType;
  description?: string;
  status: EnvironmentStatus;
  createdAt: string;
  updatedAt: string;
}
