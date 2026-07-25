import 'reflect-metadata';
import { validate } from 'class-validator';
import { IsValidTimeZone } from '../is-valid-timezone.validator';

class TestDto {
  @IsValidTimeZone()
  timeZone: string;
}

describe('common/validators/IsValidTimeZone', () => {
  it('should pass for a valid IANA time zone name', async () => {
    const dto = new TestDto();
    dto.timeZone = 'Asia/Tokyo';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail for a string that is not a valid IANA time zone name', async () => {
    const dto = new TestDto();
    dto.timeZone = 'Not/AZone';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      isValidTimeZone: 'timeZone must be a valid IANA time zone name',
    });
  });
});
