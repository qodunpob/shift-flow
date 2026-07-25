import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useMineFilter, useStatusFilter } from '@/hooks/useSearchParams';
import { scheduleStatuses } from '@/constants/common';

describe('hooks/useSearchParams', () => {
  describe('useStatusFilter', () => {
    it('should default to null when no status is present in the url', () => {
      const { result } = renderHook(() => useStatusFilter(), {
        wrapper: withNuqsTestingAdapter(),
      });

      expect(result.current[0]).toBeNull();
    });

    it('should read the status from the url', () => {
      const { result } = renderHook(() => useStatusFilter(), {
        wrapper: withNuqsTestingAdapter({ searchParams: '?status=APPROVED' }),
      });

      expect(result.current[0]).toBe('APPROVED');
    });

    it('should update the url when the status is set', async () => {
      const onUrlUpdate = jest.fn();
      const { result } = renderHook(() => useStatusFilter(), {
        wrapper: withNuqsTestingAdapter({ onUrlUpdate }),
      });

      await act(async () => {
        await result.current[1]('APPROVED');
      });

      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: '?status=APPROVED' }),
      );
    });

    it('should expose every schedule status as a valid option', () => {
      expect(scheduleStatuses).toEqual([
        'DRAFT',
        'IN_REVIEW',
        'AWAITING_APPROVAL',
        'APPROVED',
        'REJECTED',
      ]);
    });
  });

  describe('useMineFilter', () => {
    it('should default to false when no mine flag is present in the url', () => {
      const { result } = renderHook(() => useMineFilter(), {
        wrapper: withNuqsTestingAdapter(),
      });

      expect(result.current[0]).toBe(false);
    });

    it('should update the url when mine is set to true', async () => {
      const onUrlUpdate = jest.fn();
      const { result } = renderHook(() => useMineFilter(), {
        wrapper: withNuqsTestingAdapter({ onUrlUpdate }),
      });

      await act(async () => {
        await result.current[1](true);
      });

      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: '?mine=true' }),
      );
    });
  });
});
