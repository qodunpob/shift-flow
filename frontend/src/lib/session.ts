export const AUTH_COOKIE = 'access_token';

export const getJwtMaxAgeSeconds = (token: string): number | undefined => {
  const payload = token.split('.')[1];
  if (!payload) return undefined;

  try {
    const { exp } = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { exp?: number };

    if (!exp) return undefined;
    return Math.max(exp - Math.floor(Date.now() / 1000), 0);
  } catch {
    return undefined;
  }
};
