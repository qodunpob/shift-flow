import { Reflector } from '@nestjs/core';
import { UserRole } from '@/entities';

export const Roles = Reflector.createDecorator<UserRole[]>();
