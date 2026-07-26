import { useMutation } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { Shift } from '@/lib/api/types';

export interface CreateShiftInput {
  startsAt: Date;
  endsAt: Date;
  requiredHeadcount: number;
}

export const useCreateShiftMutation = (scheduleId: string) =>
  useMutation<Shift, Error, CreateShiftInput>({
    mutationFn: (input) =>
      apiFetchFromClient(`/schedules/${scheduleId}/shifts`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
