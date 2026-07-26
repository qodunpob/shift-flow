import { useFormik } from 'formik';
import { ShiftFormValues } from '@/features/shift-form/types';
import { shiftFormSchema } from '@/features/shift-form/validation-schema';

const INITIAL_VALUES: ShiftFormValues = {
  startsAtDate: null,
  startsAtTime: '',
  endsAtDate: null,
  endsAtTime: '',
  requiredHeadcount: 1,
};

export const useShiftForm = (
  onSubmit: (values: ShiftFormValues) => void,
  initialValues: ShiftFormValues = INITIAL_VALUES,
) => {
  const formik = useFormik<ShiftFormValues>({
    initialValues,
    validationSchema: shiftFormSchema,
    onSubmit,
  });

  return formik;
};
