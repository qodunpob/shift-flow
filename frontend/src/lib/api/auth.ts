import { StatusCodes } from 'http-status-codes'
import { errorMessages } from '@/constants/error-messages'
import { AuthError } from '@/lib/errors/AuthError'

export interface SignInArgs {
  email: string;
  password: string;
}

export type SignInResult = {
  accessToken: string;
}

export const signIn = async ({ email, password }: SignInArgs): Promise<SignInResult> => {
  try {
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (!response.ok) {
      const isInvalidCredentials = response.status === StatusCodes.UNAUTHORIZED;
      const status = isInvalidCredentials ? StatusCodes.UNAUTHORIZED : StatusCodes.BAD_GATEWAY;
      const message = isInvalidCredentials
        ? errorMessages.auth.invalidCredentials
        : errorMessages.auth.serviceUnavailable;
      throw new AuthError(message, status);
    }

    const body = await response.json() as { access_token: string };
    if (!body.access_token) {
      throw new AuthError(errorMessages.auth.serviceUnavailable, StatusCodes.BAD_GATEWAY);
    }
    return { accessToken: body.access_token };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(errorMessages.auth.serviceUnavailable, StatusCodes.BAD_GATEWAY);
  }
}
