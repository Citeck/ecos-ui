import cloneDeep from 'lodash/cloneDeep';

export default class JournalsConverter {
  static getSettingsForDataLoaderServer(source) {
    console.log(source);
    const _source = cloneDeep(source);
    const target = {};

    target.columns = _source.columns;
    target.predicate = _source.predicate;
    target.onlyLinked = _source.onlyLinked;
    target.recordRef = _source.recordRef;
    target.page = _source.pagination;
    target.filter = _source.predicates;
    target.groupBy = _source.groupBy;
    target.sortBy = _source.sortBy;
    //target.attributes = _source.attributes; //?
    target.queryData = _source.query;

    return target;
  }

  static getJournalDataWeb(source) {
    const target = {};

    target.data = source.records;
    target.total = source.totalCount;
    target.query = source.query;

    return target;
  }
}
