import { combineUrl } from '@/lib/api/server';

describe('lib/api/apiFetch', () => {
  describe('combineUrl', () => {
    it('should return provided url if the params object is empty', () => {
      expect(combineUrl('/some/external/route')).toBe('/some/external/route');
      expect(combineUrl('/some/external/route?p1=v1&p2=v2')).toBe(
        '/some/external/route?p1=v1&p2=v2',
      );
    });

    it('should add search params to the url', () => {
      expect(combineUrl('/some/external/route', { p1: 'v1', p2: 'v2' })).toBe(
        '/some/external/route?p1=v1&p2=v2',
      );
      expect(
        combineUrl('/some/external/route?p1=v1&p2=v2', { p3: 'v3', p4: 'v4' }),
      ).toBe('/some/external/route?p1=v1&p2=v2&p3=v3&p4=v4');
    });
  });
});
