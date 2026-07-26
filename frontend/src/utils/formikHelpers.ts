import { useFormik } from 'formik';

export const hasError = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: ReturnType<typeof useFormik<any>>,
  fieldName: string,
) => !!(formik.touched[fieldName] && formik.errors[fieldName]);
