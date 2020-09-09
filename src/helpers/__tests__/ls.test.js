import * as Storage from '../ls';
import { LocalStorageMock } from '../__mocks__/storage.mock';

const COMMON_DATA = [
  {
    title: 'correct data 1',
    key: 'KEY_1',
    data: { test1: 'test1' }
  },
  {
    title: 'correct data 2',
    key: 'KEY_2',
    data: { test2: 'test2' }
  },
  {
    title: 'no key',
    key: '',
    data: { test: 'test' }
  }
];

describe('Storage helpers', () => {
  delete window.localStorage;
  window.localStorage = new LocalStorageMock();

  describe('Set & Get data', () => {
    COMMON_DATA.forEach(_ => {
      it(_.title, () => {
        const resultSet = Storage.setData(_.key, _.data);
        const resultGet = Storage.getData(_.key);

        if (!_.key) {
          expect(resultSet).toBeNull();
          expect(resultGet).toBeNull();
        } else {
          expect(resultGet).toEqual(_.data);
        }
      });
    });
    window.localStorage.clear();
  });

  describe('Remove Item', () => {
    COMMON_DATA.forEach(_ => {
      Storage.setData(_.key, _.data);
    });

    COMMON_DATA.forEach(_ => {
      it(_.title, () => {
        const resultGetBefore = Storage.getData(_.key);
        const resultDel = Storage.removeItem(_.key, _.data);
        const resultGetAfter = Storage.getData(_.key);

        if (!_.key) {
          expect(resultDel).toBeNull();
        } else {
          expect(resultGetBefore).toEqual(_.data);
        }
        expect(resultGetAfter).toBeNull();
      });
    });

    window.localStorage.clear();
  });

  describe('Remove ItemS', () => {
    const data = COMMON_DATA.filter(_ => !!_.key);
    const count = data.length;

    afterEach(window.localStorage.clear);

    it('delete keys', () => {
      data.forEach(_ => {
        Storage.setData(_.key, _.data);
      });
      const deletedKeys = [COMMON_DATA[0].key, COMMON_DATA[1].key];

      expect(window.localStorage.length).toEqual(count);
      Storage.removeItems(deletedKeys);

      expect(window.localStorage.length).toEqual(count - deletedKeys.length);
    });

    it('delete without keys', () => {
      data.forEach(_ => {
        Storage.setData(_.key, _.data);
      });
      expect(window.localStorage.length).toEqual(count);
      const resultDel1 = Storage.removeItems();
      expect(resultDel1).toBeNull();
      expect(window.localStorage.length).toEqual(count);
    });
  });
});
