import 'reflect-metadata';
import { validate } from 'class-validator';
import { RequireTimeZone } from '../require-timezone.validator';

class TestDto {
  @RequireTimeZone()
  startsAt?: Date;

  timeZone?: string;
}

describe('common/validators/RequireTimeZone', () => {
  it('should pass when the guarded field is not provided', async () => {
    const dto = new TestDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when the guarded field is provided together with timeZone', async () => {
    const dto = new TestDto();
    dto.startsAt = new Date('2026-01-01T00:00:00.000Z');
    dto.timeZone = 'Asia/Tokyo';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when the guarded field is provided without timeZone', async () => {
    const dto = new TestDto();
    dto.startsAt = new Date('2026-01-01T00:00:00.000Z');

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      requireTimeZone:
        'timeZone is required when startsAt is provided',
    });
  });

  it('should pass when timeZone is provided without the guarded field', async () => {
    const dto = new TestDto();
    dto.timeZone = 'Asia/Tokyo';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
