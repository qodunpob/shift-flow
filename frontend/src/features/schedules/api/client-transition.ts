import 'client-only';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { schedulesQueryPrefix } from '@/features/schedules/api/client';
import { PaginatedSchedules } from '@/lib/api/types';

const schedulesQueryFilter = { queryKey: schedulesQueryPrefix } as const;

type WithdrawContext = {
  previousQueries: [readonly unknown[], PaginatedSchedules | undefined][];
};

export const useWithdrawScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, string, WithdrawContext>({
    mutationFn: (scheduleId: string) =>
      apiFetchFromClient(`/schedules/${scheduleId}/withdraw`, {
        method: 'POST',
      }),
    onMutate: async (scheduleId: string) => {
      await queryClient.cancelQueries(schedulesQueryFilter);

      const previousQueries =
        queryClient.getQueriesData<PaginatedSchedules>(schedulesQueryFilter);

      previousQueries.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<PaginatedSchedules>(queryKey, {
          ...data,
          items: data.items.map((schedule) =>
            schedule.id === scheduleId
              ? { ...schedule, status: 'DRAFT' }
              : schedule,
          ),
        });
      });

      return { previousQueries };
    },
    onError: (_error, _scheduleId, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(schedulesQueryFilter);
    },
  });
};
