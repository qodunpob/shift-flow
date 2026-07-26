import { OmitType } from '@nestjs/swagger';
import { UserEntity } from '@/entities';

/**
 * Swagger response model for a user. Omits credential/contact fields that
 * are `select: false` on the entity and never actually loaded by
 * {@link UsersService}, plus relations these endpoints don't return.
 */
export class UserResponseDto extends OmitType(UserEntity, [
  'password',
  'emailAddress',
  'assignments',
  'proposals',
] as const) {}
