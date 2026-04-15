import type { Request } from 'express';
import type { UserRole, Permission } from '@caseconnect/types';

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
  departmentId?: string;
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
