import { ScheduleFormValues } from '@/features/schedule-form/types';
import { localDateToZonedInstant } from '@/features/schedule-form/zonedDate';
import { toast } from 'react-toastify';
import { ApiError } from '@/lib/errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { useFormik } from 'formik/dist/Formik';
import { Schedule } from '@/lib/api/types';
import {
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
} from '@/features/schedules/api/client';
import { useTranslations } from 'next-intl';

export interface UseScheduleFormHandlerArgs {
  mode: 'create' | 'edit';
  schedule?: Schedule;
  resetFiltersAndPage: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}

export const useScheduleFormHandler = ({
  mode,
  schedule,
  resetFiltersAndPage,
  onClose,
  t,
}: UseScheduleFormHandlerArgs) => {
  const { mutate: createSchedule, isPending: isCreating } =
    useCreateScheduleMutation();
  const { mutate: updateSchedule, isPending: isUpdating } =
    useUpdateScheduleMutation();

  const onSubmit =
    (formik: ReturnType<typeof useFormik<ScheduleFormValues>>) =>
    (values: ScheduleFormValues) => {
      const input = {
        label: values.label,
        startsAt: localDateToZonedInstant(
          values.dates!.startsAt,
          values.timeZone,
        ),
        endsAt: localDateToZonedInstant(values.dates!.endsAt, values.timeZone),
        timeZone: values.timeZone,
      };

      const onSuccess = () => {
        toast.success(
          mode === 'create'
            ? t('CreateSchedule.success')
            : t('ScheduleActions.success.updated'),
        );

        formik.resetForm();
        resetFiltersAndPage();
        onClose();
      };
      const onError = (error: Error) => {
        const isConflict =
          error instanceof ApiError &&
          error.statusCode === StatusCodes.CONFLICT;
        toast.error(
          isConflict
            ? mode === 'create'
              ? t('CreateSchedule.errors.overlap')
              : t('CreateSchedule.errors.conflict')
            : t('CreateSchedule.errors.generic'),
        );
      };

      if (mode === 'create') {
        createSchedule(input, { onSuccess, onError });
      } else if (schedule) {
        updateSchedule({ id: schedule.id, ...input }, { onSuccess, onError });
      }
    };

  return {
    onSubmit,
    isPending: isCreating || isUpdating,
  };
};
