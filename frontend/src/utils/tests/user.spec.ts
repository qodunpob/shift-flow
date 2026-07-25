import { isMine } from '@/utils/user';

describe('utils/user', () => {
  describe('isMine', () => {
    it('should return true when createdBy matches the given user id', () => {
      expect(isMine('user-1', 'user-1')).toBe(true);
    });

    it('should return false when createdBy does not match the given user id', () => {
      expect(isMine('user-1', 'user-2')).toBe(false);
    });
  });
});
