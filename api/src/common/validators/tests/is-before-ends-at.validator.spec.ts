import 'reflect-metadata';
import { validate } from 'class-validator';
import { IsBeforeEndsAt } from '../is-before-ends-at.validator';

class TestDto {
  @IsBeforeEndsAt()
  startsAt?: Date;

  endsAt?: Date;
}

describe('common/validators/IsBeforeEndsAt', () => {
  it('should pass when startsAt is strictly before endsAt', async () => {
    const dto = new TestDto();
    dto.startsAt = new Date('2026-01-01T00:00:00.000Z');
    dto.endsAt = new Date('2026-01-07T00:00:00.000Z');

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when startsAt equals endsAt', async () => {
    const dto = new TestDto();
    dto.startsAt = new Date('2026-01-01T00:00:00.000Z');
    dto.endsAt = new Date('2026-01-01T00:00:00.000Z');

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      isBeforeEndsAt: 'startsAt must be before endsAt',
    });
  });

  it('should fail when startsAt is after endsAt', async () => {
    const dto = new TestDto();
    dto.startsAt = new Date('2026-01-10T00:00:00.000Z');
    dto.endsAt = new Date('2026-01-01T00:00:00.000Z');

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      isBeforeEndsAt: 'startsAt must be before endsAt',
    });
  });

  it('should pass when endsAt is not provided', async () => {
    const dto = new TestDto();
    dto.startsAt = new Date('2026-01-01T00:00:00.000Z');

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when startsAt is not provided', async () => {
    const dto = new TestDto();
    dto.endsAt = new Date('2026-01-01T00:00:00.000Z');

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
