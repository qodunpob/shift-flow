import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-request';

export const currentUser = (context: ExecutionContext): AuthenticatedUser =>
  context.switchToHttp().getRequest<AuthenticatedRequest>().user;

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    currentUser(context),
);
