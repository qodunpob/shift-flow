import React, { useState } from 'react'
import { DEFAULT_ROUTE } from '@/routes'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export const useSignIn = (t: ReturnType<typeof useTranslations>) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(
          response.status === 401 ? t("invalidCredentials") : t("genericError"),
        );
        return;
      }

      router.push(DEFAULT_ROUTE);
      router.refresh();
    } catch {
      setError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    error,
    isSubmitting,
    handleSubmit,
  }
}
