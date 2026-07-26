import { useEffect } from 'react';
import { useFormik } from 'formik';
import {
  createScheduleSchema,
  CreateScheduleFormValues,
} from '@/features/schedule-form/schema';

const DEFAULT_INITIAL_VALUES: CreateScheduleFormValues = {
  label: '',
  dates: null,
  timeZone: '',
};

export const useScheduleForm = (
  onSubmit: (values: CreateScheduleFormValues) => void,
  initialValues: CreateScheduleFormValues = DEFAULT_INITIAL_VALUES,
) => {
  const formik = useFormik<CreateScheduleFormValues>({
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
      applyDefaultTimeZone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...formik,
    resetForm: () => {
      formik.resetForm();
      if (!initialValues.timeZone) {
        applyDefaultTimeZone();
      }
    },
  };
};
