import { getJwtMaxAgeSeconds } from '@/lib/session';

const makeJwt = (payload: Record<string, unknown>) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString(
    'base64url',
  );
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

describe('lib/session', () => {
  describe('getJwtMaxAgeSeconds', () => {
    it('should return the seconds remaining until the token expires', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = makeJwt({ exp: nowSeconds + 3600 });

      const maxAge = getJwtMaxAgeSeconds(token);

      expect(maxAge).toBeGreaterThan(3590);
      expect(maxAge).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for an already-expired token', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = makeJwt({ exp: nowSeconds - 60 });

      expect(getJwtMaxAgeSeconds(token)).toBe(0);
    });

    it('should return undefined when the token has no payload segment', () => {
      expect(getJwtMaxAgeSeconds('not-a-jwt')).toBeUndefined();
    });

    it('should return undefined when the payload has no exp claim', () => {
      const token = makeJwt({ sub: 'user-1' });

      expect(getJwtMaxAgeSeconds(token)).toBeUndefined();
    });
  });
});
