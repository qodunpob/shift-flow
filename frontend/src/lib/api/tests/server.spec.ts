import { redirect } from 'next/navigation';
import { apiFetchFromServer } from '@/lib/api/server';
import { routes } from '@/routes';
import { StatusCodes } from 'http-status-codes';

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'test-token' }),
  }),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('lib/api/server', () => {
  describe('apiFetchFromServer', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return the parsed response body on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: StatusCodes.OK,
        json: jest.fn().mockResolvedValue({ ok: true }),
      }) as unknown as typeof fetch;

      const result = await apiFetchFromServer('/some/path');

      expect(result).toEqual({ ok: true });
    });

    it('should redirect to the login page when the session has expired', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: StatusCodes.UNAUTHORIZED,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      }) as unknown as typeof fetch;

      await apiFetchFromServer('/some/path');

      expect(redirect).toHaveBeenCalledWith(routes.login);
    });
  });
});
