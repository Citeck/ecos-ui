import { get } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';

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
  constructor(query, config = {}) {
    if (!query) {
      console.error('No Query');
      return;
    }

    this.#query = cloneDeep(query);
    const { amountPerIteration = 5 } = config || {};
    this.#amountPerIteration = amountPerIteration;
  }

  get pagination() {
    return {
      skipCount: (this.#page - 1) * this.#amountPerIteration,
      maxItems: this.#amountPerIteration,
      amountPerIteration: this.#page
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

  async iterate(callback) {
    while (!this.#isEnd) {
      const res = await this.next();
      isFunction(callback) && res && callback(res);
      this.#isEnd = !res;
    }
  }
}

export default RecordsIterator;
