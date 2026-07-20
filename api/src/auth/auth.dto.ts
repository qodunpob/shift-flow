import { ApiProperty } from '@nestjs/swagger';

/**
 * Credentials accepted by `POST /auth/login`. The body is consumed by the
 * passport-local strategy (via LocalAuthGuard), so the field names must stay
 * `username`/`password`; this DTO exists to document that shape in Swagger.
 */
export class LoginDto {
  @ApiProperty({
    example: 'test-employee@example.com',
    description: 'Email address used as the login identifier.',
  })
  username: string;

  @ApiProperty({
    example: 'test-employee@example.com',
    description:
      'Account password (equals the email address for seeded dev accounts).',
  })
  password: string;
}
