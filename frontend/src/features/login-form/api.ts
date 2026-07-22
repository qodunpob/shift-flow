import { LoginRequestArgs } from '@/app/api/auth/login/route'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RequestSignInArgs extends LoginRequestArgs {}

export interface SignInResult {
  success: boolean;
  status: number;
}

export async function requestSignIn(args: RequestSignInArgs): Promise<SignInResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  return { success: response.ok, status: response.status };
}
