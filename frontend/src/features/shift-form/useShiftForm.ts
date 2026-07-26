import { useFormik } from 'formik';
import { ShiftFormValues } from '@/features/shift-form/types';
import { shiftFormSchema } from '@/features/shift-form/validation-schema';

const INITIAL_VALUES = {
  startsAt: null,
  endsAt: null,
  requiredHeadcount: 0,
};

export const useShiftForm = (onSubmit: (values: ShiftFormValues) => void) => {
  const formik = useFormik<ShiftFormValues>({
    initialValues: INITIAL_VALUES,
    validationSchema: shiftFormSchema,
    onSubmit,
  });

  return formik;
};
