import { isMine } from '@/utils/user';

describe('utils/user', () => {
  describe('isMine', () => {
    it("should return true when the schedule's createdBy matches the given user id", () => {
      expect(isMine({ createdBy: 'user-1' }, { id: 'user-1' })).toBe(true);
    });

    it("should return false when the schedule's createdBy does not match the given user id", () => {
      expect(isMine({ createdBy: 'user-1' }, { id: 'user-2' })).toBe(false);
    });
  });
});
