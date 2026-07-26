import { LoginForm } from '@/features/login-form/LoginForm';
import { logger } from '@/lib/logger';

export default async function LoginPage() {
  logger.info(`DEBUG API CONNECTION ${process.env.API_URL}`);
  const response = await fetch(`${process.env.API_URL}/health`);
  logger.info(`API ANSWERED ${response.ok}`);
  return <LoginForm />;
}
