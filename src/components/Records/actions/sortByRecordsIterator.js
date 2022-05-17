/**
 * @class
 */
class SortByRecordsIterator {
  #skipCount = 1;
  #page = 1;

  /**
   * @param {IterableRecordsConfig} config
   */
  constructor(config = {}) {
    const { skipCount } = config.pagination || IterableRecordsConfig.pagination;
    this.#skipCount = skipCount;
  }
}

export default SortByRecordsIterator;

/** @type IterableRecordsConfig */
export const IterableRecordsConfig = {
  pagination: {
    skipCount: 50
  }
};
