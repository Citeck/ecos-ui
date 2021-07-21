import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import AttributesService from '../services/AttributesService';
import { ParserPredicate } from '../components/Filters/predicates';
import { getId } from '../helpers/util';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

export default class JournalsConverter {
  static cleanUpPredicate(predicate) {
    return ParserPredicate.removeEmptyPredicates(cloneDeep(predicate));
  }

  static optimizePredicate(predicate) {
    if (!isPredicateValid(predicate)) {
      return {};
    }

    if (predicate.t === 'and' || predicate.t === 'or') {
      const predicates = (predicate.val || []).map(pred => JournalsConverter.optimizePredicate(pred)).filter(isPredicateValid);

      if (predicates.length === 0) {
        return {};
      } else if (predicates.length === 1) {
        return predicates[0];
      } else {
        return {
          ...predicate,
          val: predicates
        };
      }
    }

    return cloneDeep(predicate);
  }

  static getSettingsForDataLoaderServer(source) {
    const _source = cloneDeep(source);
    const target = {};

    const permissionsObj = get(_source, 'journalSetting.permissions') || _source.permissions || {};
    const permissionsArr = [];
    for (let key in permissionsObj) {
      if (permissionsObj.hasOwnProperty(key) && permissionsObj[key]) {
        permissionsArr.push(key);
      }
    }

    target.customSourceId = _source.sourceId;
    target.predicate = _source.predicate;
    target.onlyLinked = !!_source.onlyLinked;
    target.recordRef = _source.recordRef;
    target.page = _source.pagination;
    target.filter = concat(_source.predicates, _source.searchPredicate);
    target.groupBy = _source.groupBy;
    target.sortBy = _source.sortBy;
    target.attributes = {
      ..._source.attributes,
      ...AttributesService.hasContent,
      ...AttributesService.getPermissions(permissionsArr)
    };

    return target;
  }

  static getJournalDataWeb(source) {
    const target = {};

    target.data = source.records;
    target.total = source.totalCount;
    target.query = source.query;
    target.attributes = source.attributes;

    return target;
  }

  static getJournalActions(source) {
    return {
      forRecords: source.forRecords || {},
      forQuery: source.forQuery || {},
      forRecord: source.forRecord || {}
    };
  }

  static mergeColumnsSetup(arrayFrom, arrayTo, compareField = 'dataField') {
    let result = cloneDeep(arrayTo);

    if (isEmpty(arrayFrom) || isEqual(arrayFrom, arrayTo)) {
      return result;
    }

    for (let i = result.length - 1; i >= 0; i--) {
      const item = arrayFrom.find(item => item[compareField] === result[i][compareField]);

      if (isEmpty(item)) {
        continue;
      }

      result[i] = {
        ...result[i],
        ...item
      };
    }

    return result;
  }

  static injectId(data) {
    if (Array.isArray(data)) {
      return data.map(item => JournalsConverter.injectId(item));
    }

    return data.id
      ? data
      : {
          ...data,
          id: getId()
        };
  }
}
