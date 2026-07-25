import { useEffect } from 'react';
import { useFormik } from 'formik';
import {
  createScheduleSchema,
  CreateScheduleFormValues,
} from '@/features/create-schedule/schema';

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

  // Default timeZone to the browser's own zone. This can only run on the
  // client (Intl.DateTimeFormat().resolvedOptions().timeZone would return
  // the server's zone during SSR, not the user's), hence the effect rather
  // than an initial value.
  useEffect(() => {
    formik.setFieldValue(
      'timeZone',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return formik;
};
