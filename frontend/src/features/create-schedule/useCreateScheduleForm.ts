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
) =>
  useFormik<CreateScheduleFormValues>({
    initialValues: INITIAL_VALUES,
    validationSchema: createScheduleSchema,
    onSubmit,
  });
