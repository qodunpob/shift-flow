import 'server-only';
import { StatusCodes } from 'http-status-codes';
import { errorMessages } from '@/constants/error-messages';
import { AuthError } from '@/lib/errors/AuthError';
import { logger } from '@/lib/logger';

export interface SignInArgs {
  emailAddress: string;
  password: string;
}

export type SignInResult = {
  accessToken: string;
};

export const signIn = async ({
  emailAddress,
  password,
}: SignInArgs): Promise<SignInResult> => {
  try {
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: emailAddress, password }),
    });

    if (!response.ok) {
      logger.error(
        `Response wasn't successful: ${response.status} ${response.statusText}`,
      );
      const isInvalidCredentials = response.status === StatusCodes.UNAUTHORIZED;
      const status = isInvalidCredentials
        ? StatusCodes.UNAUTHORIZED
        : StatusCodes.BAD_GATEWAY;
      const message = isInvalidCredentials
        ? errorMessages.auth.invalidCredentials
        : errorMessages.auth.serviceUnavailable;
      throw new AuthError(message, status);
    }

    const data = (await response.json()) as { access_token: string };
    if (!data.access_token) {
      logger.error('No access token in response');
      throw new AuthError(
        errorMessages.auth.serviceUnavailable,
        StatusCodes.BAD_GATEWAY,
      );
    }
    return { accessToken: data.access_token };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    logger.error(error);
    throw new AuthError(
      errorMessages.auth.serviceUnavailable,
      StatusCodes.BAD_GATEWAY,
    );
  }
};
