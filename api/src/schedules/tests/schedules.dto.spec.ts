import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateScheduleDto, UpdateScheduleDto } from '../schedules.dto';

describe('schedules/schedules.dto', () => {
  describe('CreateScheduleDto', () => {
    it('should pass with a valid timeZone', async () => {
      const dto = plainToInstance(CreateScheduleDto, {
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-01-07T00:00:00.000Z',
        timeZone: 'Asia/Tokyo',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when timeZone is missing', async () => {
      const dto = plainToInstance(CreateScheduleDto, {
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-01-07T00:00:00.000Z',
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('timeZone');
    });

    it('should fail when timeZone is not a valid IANA zone', async () => {
      const dto = plainToInstance(CreateScheduleDto, {
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-01-07T00:00:00.000Z',
        timeZone: 'Not/AZone',
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('timeZone');
    });
  });

  describe('UpdateScheduleDto', () => {
    it('should pass with no fields at all', async () => {
      const dto = plainToInstance(UpdateScheduleDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass when only label changes', async () => {
      const dto = plainToInstance(UpdateScheduleDto, { label: 'Renamed' });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when startsAt is provided without timeZone', async () => {
      const dto = plainToInstance(UpdateScheduleDto, {
        startsAt: '2026-01-02T00:00:00.000Z',
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('startsAt');
    });

    it('should fail when endsAt is provided without timeZone', async () => {
      const dto = plainToInstance(UpdateScheduleDto, {
        endsAt: '2026-01-10T00:00:00.000Z',
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('endsAt');
    });

    it('should pass when startsAt is provided together with timeZone', async () => {
      const dto = plainToInstance(UpdateScheduleDto, {
        startsAt: '2026-01-02T00:00:00.000Z',
        timeZone: 'Asia/Tokyo',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass when endsAt is provided together with timeZone', async () => {
      const dto = plainToInstance(UpdateScheduleDto, {
        endsAt: '2026-01-10T00:00:00.000Z',
        timeZone: 'Asia/Tokyo',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
