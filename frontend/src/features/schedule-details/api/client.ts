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

export interface UpdateShiftInput {
  id: string;
  startsAt: Date;
  endsAt: Date;
  requiredHeadcount: number;
}

export const useUpdateShiftMutation = () =>
  useMutation<Shift, Error, UpdateShiftInput>({
    mutationFn: ({ id, ...input }) =>
      apiFetchFromClient(`/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  });
