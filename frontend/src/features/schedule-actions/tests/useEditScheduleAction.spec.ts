import { act, renderHook } from '@testing-library/react';
import { useEditScheduleAction } from '../useEditScheduleAction';

describe('features/schedule-actions/useEditScheduleAction', () => {
  it('should start closed', () => {
    const { result } = renderHook(() => useEditScheduleAction());

    expect(result.current.isOpen).toBe(false);
  });

  it('should open when open is called', () => {
    const { result } = renderHook(() => useEditScheduleAction());

    act(() => result.current.open());

    expect(result.current.isOpen).toBe(true);
  });

  it('should close when close is called', () => {
    const { result } = renderHook(() => useEditScheduleAction());

    act(() => result.current.open());
    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
  });
});
