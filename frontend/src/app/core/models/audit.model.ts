export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ENABLE'
  | 'DISABLE'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditEntity = 'CONFIGURATION' | 'ENVIRONMENT' | 'USER' | 'ROLE' | 'SETTINGS' | 'AUTH';

export type AuditResult = 'SUCCESS' | 'FAILURE';

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  environmentId: string | null;
  description: string;
  result: AuditResult;
}
