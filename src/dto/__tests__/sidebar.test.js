import { raw, formatted } from '../__mocks__/sidebar.mock';
import SC from '../sidebar';

describe('SidebarConverter', () => {
  describe('getMenuListWeb', () => {
    it('Must take the label value from the main menu item configuration', () => {
      expect(SC.getMenuListWeb(raw[0])).toEqual(formatted[0]);
    });

    it('Must take label value from _remoteData_ (There is no label value in the main config)', () => {
      expect(SC.getMenuListWeb(raw[1])).toEqual(formatted[1]);
    });

    it('Menu item with type JOURNAL takes journalId from _remoteData_', () => {
      const result = SC.getMenuListWeb(raw[2]);

      expect(result[0].items.map(i => i.params.journalId)).toEqual(formatted[2][0].items.map(i => i.params.journalId));
    });

    it('After processing, the _remoteData_ object is deleted', () => {
      const result = SC.getMenuListWeb(raw[2]);
      const arr = [];

      result[0].items.forEach(i => {
        if (i._remoteData_) {
          arr.push(i._remoteData_);
        }
      });

      expect(arr).toEqual([]);
    });
  });
});
