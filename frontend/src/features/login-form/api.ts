export interface SignInResult {
  success: boolean;
  status: number;
}

export async function requestSignIn(
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null,
): Promise<SignInResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return { success: response.ok, status: response.status };
}
