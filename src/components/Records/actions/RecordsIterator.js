import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import Records from '../Records';

/**
 * @class
 * @desc Batches of records by a given number are requested
 */
class RecordsIterator {
  _page = 1;
  _amountPerIteration;
  _query = null;
  _queryInitial = null;
  _lastDate = null;
  _isEnd = false;
  _skipCount = 0;

  /**
   * @param {Object} query
   * @param {IterableRecordsConfig} config
   */
  constructor(query, config) {
    if (isEmpty(query)) {
      throw new Error('No Query');
    }

    this._query = cloneDeep(query);
    this._queryInitial = query;
    const { amountPerIteration = 10 } = config || {};
    this._amountPerIteration = Number(amountPerIteration);
  }

  get pagination() {
    return {
      skipCount: this._skipCount,
      maxItems: this._amountPerIteration,
      page: this._page
    };
  }

  async next() {
    this._query.page = this.pagination;
    const res = await Records.query(this._query, ['_created']).catch(e => {
      console.error(e);
      return [];
    });

    if (res.records && res.records.length) {
      if (this._lastDate === res.records[res.records.length - 1]['_created']) {
        this._skipCount += this._amountPerIteration;
      } else {
        const lastDateRecords = res.records[res.records.length - 1]['_created'];
        if (lastDateRecords) {
          this._lastDate = lastDateRecords;
        }
        this._skipCount = 0;
        res.records.forEach(record => record['_created'] && record['_created'] === this._lastDate && this._skipCount++);
      }
    }

    if (this._lastDate) {
      this._query.query = {
        t: 'and',
        val: [
          ...this._queryInitial.query.val,
          {
            att: '_created',
            t: 'ge',
            val: this._lastDate
          }
        ]
      };
    }

    this._page++;

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
    while (!this._isEnd) {
      const res = await this.next();

      if (res && isFunction(callback)) {
        await callback(res);
      }

      if (!res || (res.records && res.records.length < this._amountPerIteration)) {
        this._isEnd = true;
      }
    }
  }
}

export default RecordsIterator;
