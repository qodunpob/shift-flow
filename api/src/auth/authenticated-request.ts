import { Request } from 'express';
import { UserRole } from '@/entities';

export interface AuthenticatedUser {
  id: string;
  roles: UserRole[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface JWTPayload {
  sub: string;
  roles: UserRole[];
}
