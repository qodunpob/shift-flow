import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateShiftDto, UpdateShiftDto } from '../shifts.dto';

describe('shifts/shifts.dto', () => {
  describe('CreateShiftDto', () => {
    it('should pass when startsAt is before endsAt', async () => {
      const dto = plainToInstance(CreateShiftDto, {
        startsAt: '2026-01-01T08:00:00.000Z',
        endsAt: '2026-01-01T16:00:00.000Z',
        requiredHeadcount: 2,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when startsAt equals endsAt', async () => {
      const dto = plainToInstance(CreateShiftDto, {
        startsAt: '2026-01-01T08:00:00.000Z',
        endsAt: '2026-01-01T08:00:00.000Z',
        requiredHeadcount: 2,
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('startsAt');
    });

    it('should fail when startsAt is after endsAt', async () => {
      const dto = plainToInstance(CreateShiftDto, {
        startsAt: '2026-01-01T16:00:00.000Z',
        endsAt: '2026-01-01T08:00:00.000Z',
        requiredHeadcount: 2,
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('startsAt');
    });
  });

  describe('UpdateShiftDto', () => {
    it('should pass with no fields at all', async () => {
      const dto = plainToInstance(UpdateShiftDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass when only requiredHeadcount changes', async () => {
      const dto = plainToInstance(UpdateShiftDto, { requiredHeadcount: 3 });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass when startsAt is provided without endsAt', async () => {
      const dto = plainToInstance(UpdateShiftDto, {
        startsAt: '2026-01-01T08:00:00.000Z',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass when startsAt is before endsAt', async () => {
      const dto = plainToInstance(UpdateShiftDto, {
        startsAt: '2026-01-01T08:00:00.000Z',
        endsAt: '2026-01-01T16:00:00.000Z',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when startsAt is not before endsAt', async () => {
      const dto = plainToInstance(UpdateShiftDto, {
        startsAt: '2026-01-01T16:00:00.000Z',
        endsAt: '2026-01-01T08:00:00.000Z',
      });

      const errors = await validate(dto);

      expect(errors.map((e) => e.property)).toContain('startsAt');
    });
  });
});
