import { NextResponse } from 'next/server';
import { AUTH_COOKIE, getJwtMaxAgeSeconds } from '@/lib/session';
import { signIn } from '@/lib/api/auth';
import { StatusCodes } from 'http-status-codes';
import { errorMessages } from '@/constants/error-messages';
import { AuthError } from '@/lib/errors/AuthError';

export interface LoginRequestArgs {
  emailAddress?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const { emailAddress, password } = validateCredentials(
      await parseCredentials(request),
    );
    const { accessToken } = await signIn({ emailAddress, password });

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: getJwtMaxAgeSeconds(accessToken),
    });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { message: errorMessages.internalServerError },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}

const parseCredentials = async (request: Request) => {
  try {
    return (await request.json()) as LoginRequestArgs;
  } catch {
    throw new AuthError(
      errorMessages.auth.missingCredentials,
      StatusCodes.BAD_REQUEST,
    );
  }
};

const validateCredentials = ({ emailAddress, password }: LoginRequestArgs) => {
  if (!emailAddress || !password) {
    throw new AuthError(
      errorMessages.auth.missingCredentials,
      StatusCodes.BAD_REQUEST,
    );
  }
  return { emailAddress, password };
};
