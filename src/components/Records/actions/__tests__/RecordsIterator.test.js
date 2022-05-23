import { async } from 'regenerator-runtime';
import RecordsIterator from '../RecordsIterator';

const def_amountPerIteration = 10;
const stop_page = 5;

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

    it('custom amountPerIteration', async () => {
      const amountPerIteration = 20;
      const iterator = new RecordsIterator({ query: {} }, { amountPerIteration });
      expect(iterator.pagination).toEqual({ skipCount: 0, maxItems: 20, page: 1 });

      const res = await iterator.next();
      expect(iterator.pagination).toEqual({ skipCount: amountPerIteration, maxItems: amountPerIteration, page: 2 });
      expect(res.records.length).toEqual(amountPerIteration);
    });
  });

  describe('next', () => {
    const iterator = new RecordsIterator({});

    it('1 page & result', async () => {
      const res = await iterator.next();
      expect(iterator.pagination).toEqual({ skipCount: 10, maxItems: def_amountPerIteration, page: 2 });
      expect(res.records.length).toEqual(def_amountPerIteration);
    });

    it('2 page', async () => {
      await iterator.next();
      expect(iterator.pagination).toEqual({ skipCount: 20, maxItems: def_amountPerIteration, page: 3 });
    });

    it(stop_page + ' "last" page', async () => {
      await iterator.next();
      await iterator.next();
      const last = await iterator.next();
      expect(last).toEqual(null);
      expect(iterator.pagination).toEqual({
        skipCount: stop_page * def_amountPerIteration,
        maxItems: def_amountPerIteration,
        page: stop_page + 1
      });
    });
  });

  describe('iterate', () => {
    it('iteration without callback', async () => {
      const iterator = new RecordsIterator({});
      await iterator.iterate();
      expect(iterator.pagination).toEqual({
        skipCount: stop_page * def_amountPerIteration,
        maxItems: def_amountPerIteration,
        page: stop_page + 1
      });
    });

    it('iteration with callback', async () => {
      const iterator = new RecordsIterator({});

      const callback = res => {
        if (iterator.pagination.page <= stop_page) {
          expect(res.records.length).toEqual(def_amountPerIteration);
        } else {
          expect(res).toEqual(null);
        }
      };

      await iterator.iterate(callback);

      expect(iterator.pagination).toEqual({
        skipCount: stop_page * def_amountPerIteration,
        maxItems: def_amountPerIteration,
        page: stop_page + 1
      });
    });
  });
});
