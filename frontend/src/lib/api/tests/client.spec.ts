import { apiFetchFromClient } from '@/lib/api/client';
import { StatusCodes } from 'http-status-codes';

describe('lib/api/client', () => {
  describe('apiFetchFromClient', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it('should return the parsed response body on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: StatusCodes.OK,
        ok: true,
        json: jest.fn().mockResolvedValue({ ok: true }),
      }) as unknown as typeof fetch;

      const result = await apiFetchFromClient('/some/path');

      expect(result).toEqual({ ok: true });
    });

    it('should redirect to the login page when the session has expired', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: StatusCodes.UNAUTHORIZED,
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      }) as unknown as typeof fetch;

      // Suppress console errors for navigation not implemented
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(apiFetchFromClient('/some/path')).rejects.toThrow(
        'Session expired',
      );

      consoleError.mockRestore();
    });

    it('should throw when the response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Boom' }),
      }) as unknown as typeof fetch;

      await expect(apiFetchFromClient('/some/path')).rejects.toThrow(
        'Request to /some/path failed with status 500',
      );
    });
  });
});
