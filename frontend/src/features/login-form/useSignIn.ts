import React, { useState } from 'react';
import { DEFAULT_ROUTE } from '@/routes';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { requestSignIn } from '@/features/login-form/api';
import { StatusCodes } from 'http-status-codes';

export const useSignIn = (t: ReturnType<typeof useTranslations>) => {
  const tErrors = useTranslations('commonErrors');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const emailAddress = formData.get('emailAddress')?.toString();
      const password = formData.get('password')?.toString();

      const result = await requestSignIn({ emailAddress, password });

      if (!result.success) {
        setError(
          result.status === StatusCodes.UNAUTHORIZED
            ? t('invalidCredentials')
            : tErrors('generic'),
        );
        return;
      }

      router.push(DEFAULT_ROUTE);
      router.refresh();
    } catch {
      setError(tErrors('generic'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    error,
    isSubmitting,
    handleSubmit,
  };
};
