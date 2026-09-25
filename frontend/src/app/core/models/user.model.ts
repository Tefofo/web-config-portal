import { RoleCode } from './role.model';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleCode;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

/** The authenticated principal exposed to the app after login. */
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleCode;
}
