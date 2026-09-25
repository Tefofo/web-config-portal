export type ConfigurationType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'DATE' | 'JSON';

export type ConfigurationStatus = 'ACTIVE' | 'DISABLED';

export interface Configuration {
  id: string;
  name: string;
  key: string;
  description?: string;
  category: string;
  environmentId: string;
  type: ConfigurationType;
  value: unknown;
  defaultValue?: unknown;
  status: ConfigurationStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export const CONFIGURATION_TYPE_LABELS: Record<ConfigurationType, string> = {
  STRING: 'String',
  NUMBER: 'Number',
  BOOLEAN: 'Boolean',
  SELECT: 'Select',
  DATE: 'Date',
  JSON: 'JSON',
};

/** Payload for creating a configuration (server assigns id/audit fields). */
export interface CreateConfigurationRequest {
  name: string;
  key: string;
  description?: string;
  category: string;
  environmentId: string;
  type: ConfigurationType;
  value: unknown;
  defaultValue?: unknown;
  ownerId: string;
  status: ConfigurationStatus;
}

/** Partial update; key and environment are immutable after creation. */
export type UpdateConfigurationRequest = Partial<
  Omit<CreateConfigurationRequest, 'key' | 'environmentId'>
>;
