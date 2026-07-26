import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { User } from '@/lib/api/types';

export const useAvailableEmployeesQuery = (shiftId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['users', { availableFor: shiftId }],
    queryFn: () =>
      apiFetchFromClient<User[]>('/users', {
        params: { availableFor: shiftId },
      }),
    enabled,
  });

export interface CreateAssignmentInput {
  employeeId: string;
}

export const useCreateAssignmentMutation = (shiftId: string) =>
  useMutation<unknown, Error, CreateAssignmentInput>({
    mutationFn: (input) =>
      apiFetchFromClient(`/shifts/${shiftId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });

export const useDeleteAssignmentMutation = () =>
  useMutation<unknown, Error, string>({
    mutationFn: (assignmentId) =>
      apiFetchFromClient(`/assignments/${assignmentId}`, {
        method: 'DELETE',
      }),
  });

export const useCreateProposalMutation = (shiftId: string) =>
  useMutation<unknown, Error, void>({
    mutationFn: () =>
      apiFetchFromClient(`/shifts/${shiftId}/assignment-proposals`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  });
