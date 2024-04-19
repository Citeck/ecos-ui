import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';

import Records from '../Records';

/**
 * @class
 * @desc Batches of records by a given number are requested
 */
class RecordsIterator {
  #page = 1;
  #amountPerIteration;
  #query = null;
  #queryInitial = null;
  #lastDate = null;
  #isEnd = false;
  #skipCount = 0;

  /**
   * @param {Object} query
   * @param {IterableRecordsConfig} config
   */
  constructor(query, config) {
    if (isEmpty(query)) {
      throw new Error('No Query');
    }

    this.#query = cloneDeep(query);
    this.#queryInitial = query;
    const { amountPerIteration = 10 } = config || {};
    this.#amountPerIteration = Number(amountPerIteration);
  }

  get pagination() {
    return {
      skipCount: this.#skipCount,
      maxItems: this.#amountPerIteration,
      page: this.#page
    };
  }

  async next() {
    this.#query.page = this.pagination;
    const res = await Records.query(this.#query, ['_created']).catch(e => {
      console.error(e);
      return [];
    });

    if (res.records && res.records.length) {
      if (this.#lastDate === res.records[res.records.length - 1]['_created']) {
        this.#skipCount += this.#amountPerIteration;
      } else {
        const lastDateRecords = res.records[res.records.length - 1]['_created'];
        if (lastDateRecords) {
          this.#lastDate = lastDateRecords;
        }
        this.#skipCount = 0;
        res.records.forEach(record => record['_created'] && record['_created'] === this.#lastDate && this.#skipCount++);
      }
    }

    if (this.#lastDate) {
      this.#query.query = {
        t: 'and',
        val: [
          ...this.#queryInitial.query.val,
          {
            att: '_created',
            t: 'ge',
            val: this.#lastDate
          }
        ]
      };
    }

    this.#page++;

    if (!get(res, 'records.length')) {
      return null;
    }

    return res;
  }

  /**
   * Iterate query by page
   * @param {?Function} callback
   */
  async iterate(callback) {
    while (!this.#isEnd) {
      const res = await this.next();

      if (res && isFunction(callback)) {
        await callback(res);
      }

      if (!res || (res.records && res.records.length < this.#amountPerIteration)) {
        this.#isEnd = true;
      }
    }
  }
}

export default RecordsIterator;
