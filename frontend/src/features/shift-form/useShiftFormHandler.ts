import { useFormik } from 'formik/dist/Formik';
import { toast } from 'react-toastify';
import { StatusCodes } from 'http-status-codes';
import { useTranslations } from 'next-intl';
import { ShiftFormValues } from '@/features/shift-form/types';
import { localDateTimeToZonedInstant } from '@/features/shift-form/zonedDateTime';
import {
  useCreateShiftMutation,
  useUpdateShiftMutation,
} from '@/features/schedule-details/api/client';
import { ApiError } from '@/lib/errors/ApiError';
import { useRouter } from '@/i18n/navigation';

export interface UseShiftFormHandlerArgs {
  mode: 'create' | 'edit';
  scheduleId?: string;
  shiftId?: string;
  timeZone: string;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}

export const useShiftFormHandler = ({
  mode,
  scheduleId,
  shiftId,
  timeZone,
  onClose,
  t,
}: UseShiftFormHandlerArgs) => {
  const router = useRouter();
  const { mutate: createShift, isPending: isCreating } = useCreateShiftMutation(
    scheduleId ?? '',
  );
  const { mutate: updateShift, isPending: isUpdating } =
    useUpdateShiftMutation();

  const onSubmit =
    (formik: ReturnType<typeof useFormik<ShiftFormValues>>) =>
    (values: ShiftFormValues) => {
      const input = {
        startsAt: localDateTimeToZonedInstant(
          values.startsAtDate!,
          values.startsAtTime,
          timeZone,
        ),
        endsAt: localDateTimeToZonedInstant(
          values.endsAtDate!,
          values.endsAtTime,
          timeZone,
        ),
        requiredHeadcount: values.requiredHeadcount,
      };

      const onSuccess = () => {
        toast.success(
          mode === 'create'
            ? t('ShiftForm.success')
            : t('ShiftForm.updateSuccess'),
        );
        formik.resetForm();
        router.refresh();
        onClose();
      };
      const onError = (error: Error) => {
        const isConflict =
          error instanceof ApiError &&
          error.statusCode === StatusCodes.CONFLICT;
        toast.error(
          isConflict
            ? t('ShiftForm.errors.conflict')
            : t('commonErrors.generic'),
        );
      };

      if (mode === 'create') {
        createShift(input, { onSuccess, onError });
      } else if (shiftId) {
        updateShift({ id: shiftId, ...input }, { onSuccess, onError });
      }
    };

  return { onSubmit, isPending: isCreating || isUpdating };
};
