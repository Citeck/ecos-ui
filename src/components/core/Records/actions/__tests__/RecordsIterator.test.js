import RecordsIterator from '../RecordsIterator';

const def_amountPerIteration = 10;
const stop_page = 5;

const skipCountRecords = records => {
  return records.filter(record => record['_created'] && record['_created'] === records[0]['_created']).length;
};

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);
  const page = body.query.page;
  const records = stop_page <= page.page ? [] : new Array(page.maxItems).fill('workspace://');

  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        records,
        messages: []
      })
  });
});

describe('RecordsIterator', () => {
  describe('constructor', () => {
    it('default', () => {
      const iterator = new RecordsIterator({ query: {} });
      expect(iterator.pagination).toEqual({ skipCount: 0, maxItems: def_amountPerIteration, page: 1 });
    });

    it('bad query / empty', () => {
      try {
        new RecordsIterator();
      } catch (error) {
        expect(error).not.toBeUndefined();
      }
    });

    it('custom amountPerIteration', async () => {
      const amountPerIteration = 20;
      const iterator = new RecordsIterator({ query: {} }, { amountPerIteration });
      expect(iterator.pagination).toEqual({ skipCount: 0, maxItems: 20, page: 1 });

      const res = await iterator.next();
      expect(iterator.pagination).toEqual({ skipCount: skipCountRecords(res.records), maxItems: amountPerIteration, page: 2 });
      expect(res.records.length).toEqual(amountPerIteration);
    });
  });

  describe('next', () => {
    const iterator = new RecordsIterator({ query: {} });

    it('1 page & result', async () => {
      const res = await iterator.next();
      expect(iterator.pagination).toEqual({ skipCount: skipCountRecords(res.records), maxItems: def_amountPerIteration, page: 2 });
      expect(res.records.length).toEqual(def_amountPerIteration);
    });

    it('2 page', async () => {
      const res = await iterator.next();
      expect(iterator.pagination).toEqual({ skipCount: skipCountRecords(res.records), maxItems: def_amountPerIteration, page: 3 });
    });

    it(stop_page + ' "last" page', async () => {
      await iterator.next();
      await iterator.next();
      const last = await iterator.next();
      expect(last).toEqual(null);

      /* Since the last value of res is 0, the skipCount will also be 0 */
      expect(iterator.pagination).toEqual({
        skipCount: 0,
        maxItems: def_amountPerIteration,
        page: stop_page + 1
      });
    });
  });

  describe('iterate', () => {
    it('iteration without callback', async () => {
      const iterator = new RecordsIterator({ query: {} });
      await iterator.iterate();

      /* Since the calculations are done inside the iterator without a callback,
      it is not possible to determine the value of skipCount */
      expect({ maxItems: iterator.pagination.maxItems, page: iterator.pagination.page }).toEqual({
        maxItems: def_amountPerIteration,
        page: stop_page + 1
      });
    });

    it('iteration with callback', async () => {
      let skipCount = 0;
      const iterator = new RecordsIterator({ query: {} });
      const spy = {
        callback: res => {
          if (iterator.pagination.page <= stop_page) {
            skipCount = skipCountRecords(res.records);
            expect(res.records.length).toEqual(def_amountPerIteration);
          } else {
            expect(res).toEqual(null);
            skipCount = 0;
          }
        }
      };
      const spyOnCallback = jest.spyOn(spy, 'callback');
      await iterator.iterate(spy.callback);

      expect(iterator.pagination).toEqual({
        skipCount: skipCount,
        maxItems: def_amountPerIteration,
        page: stop_page + 1
      });
      expect(spyOnCallback).toHaveBeenCalled();
    });
  });
});
