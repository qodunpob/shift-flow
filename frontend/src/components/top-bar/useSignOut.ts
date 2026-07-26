import { requestSignOut } from '@/features/login-form/api';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/routes';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

export const useSignOut = () => {
  const router = useRouter();
  const tError = useTranslations('commonErrors');

  const signOut = async () => {
    const response = await requestSignOut();
    if (response.ok) {
      router.push(routes.login);
      return;
    }

    toast.error(tError('generic'));
  };

  return signOut;
};
