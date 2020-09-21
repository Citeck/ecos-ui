import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';

export default class JournalsConverter {
  static getSettingsForDataLoaderServer(source) {
    const _source = cloneDeep(source);
    const target = {};

    target.predicate = _source.predicate;
    target.onlyLinked = !!_source.onlyLinked;
    target.recordRef = _source.recordRef;
    target.page = _source.pagination;
    target.filter = concat(_source.predicates, _source.searchPredicate);
    target.groupBy = _source.groupBy;
    target.sortBy = _source.sortBy;
    //target.attributes = _source.attributes; //todo permissions

    return target;
  }

  static getJournalDataWeb(source) {
    const target = {};

    target.data = source.records;
    target.total = source.totalCount;
    target.query = source.query;

    return target;
  }

  static getJournalActions(source) {
    return {
      forRecords: source.forRecords || {},
      forQuery: source.forQuery || {},
      forRecord: source.forRecord || {}
    };
  }
}
