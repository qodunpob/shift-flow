import { useEffect } from 'react';
import { useFormik } from 'formik';
import { createScheduleSchema } from '@/features/schedule-form/validation-schema';
import { ScheduleFormValues } from '@/features/schedule-form/types';

const DEFAULT_INITIAL_VALUES: ScheduleFormValues = {
  label: '',
  dates: null,
  timeZone: '',
};

export const useScheduleForm = (
  onSubmit: (values: ScheduleFormValues) => void,
  initialValues: ScheduleFormValues = DEFAULT_INITIAL_VALUES,
) => {
  const formik = useFormik<ScheduleFormValues>({
    initialValues,
    validationSchema: createScheduleSchema,
    onSubmit,
  });

  const applyDefaultTimeZone = () =>
    formik.setFieldValue(
      'timeZone',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );

  useEffect(() => {
    // Only default to the browser's zone when no zone was supplied up
    // front - i.e. create mode. Edit mode always supplies the schedule's
    // real persisted zone as part of initialValues, and must not have it
    // silently overwritten by the browser's own zone.
    if (!initialValues.timeZone) {
      void applyDefaultTimeZone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...formik,
    resetForm: () => {
      formik.resetForm();
      if (!initialValues.timeZone) {
        void applyDefaultTimeZone();
      }
    },
  };
};
