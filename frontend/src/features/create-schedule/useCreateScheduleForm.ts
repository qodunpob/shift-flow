import { useEffect } from 'react';
import { useFormik } from 'formik';
import { createScheduleSchema } from '@/features/create-schedule/validation-schema';
import { CreateScheduleFormValues } from '@/features/create-schedule/types';

const INITIAL_VALUES: CreateScheduleFormValues = {
  label: '',
  dates: null,
  timeZone: '',
};

export const useCreateScheduleForm = (
  onSubmit: (values: CreateScheduleFormValues) => void,
) => {
  const formik = useFormik<CreateScheduleFormValues>({
    initialValues: INITIAL_VALUES,
    validationSchema: createScheduleSchema,
    onSubmit,
  });

  const applyDefaultTimeZone = () =>
    formik.setFieldValue(
      'timeZone',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );

  useEffect(() => {
    void applyDefaultTimeZone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...formik,
    resetForm: () => {
      formik.resetForm();
      void applyDefaultTimeZone();
    },
  };
};
