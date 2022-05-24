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
  #isEnd = false;

  /**
   * @param {Object} query
   * @param {IterableRecordsConfig} config
   */
  constructor(query, config) {
    if (isEmpty(query)) {
      throw new Error('No Query');
    }

    this.#query = cloneDeep(query);
    const { amountPerIteration = 10 } = config || {};
    this.#amountPerIteration = amountPerIteration;
  }

  get pagination() {
    return {
      skipCount: (this.#page - 1) * this.#amountPerIteration,
      maxItems: this.#amountPerIteration,
      page: this.#page
    };
  }

  async next() {
    this.#query.page = this.pagination;
    const res = await Records.query(this.#query).catch(e => {
      console.error(e);
      return [];
    });

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

      this.#isEnd = !res;
    }
  }
}

export default RecordsIterator;
