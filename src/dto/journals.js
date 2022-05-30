import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import Predicate from '../components/Filters/predicates/Predicate';
import AttributesService from '../services/AttributesService';
import { ParserPredicate } from '../components/Filters/predicates';
import { getId } from '../helpers/util';
import { PREDICATE_CONTAINS, PREDICATE_OR } from '../components/Records/predicates/predicates';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

export default class JournalsConverter {
  static cleanUpPredicate(predicate) {
    return ParserPredicate.removeEmptyPredicates(cloneDeep(predicate));
  }

  static searchConfigProcessed(predicate, searchConfigByColumn) {
    let val = get(predicate, 'val', get(predicate, 'v'));

    if (Array.isArray(val)) {
      return val.map(item => JournalsConverter.searchConfigProcessed(item, searchConfigByColumn));
    }

    const attribute = get(predicate, 'att', get(predicate, 'a'));
    const delimiters = get(searchConfigByColumn, [attribute, 'delimiters'], []);

    if (predicate.t === PREDICATE_CONTAINS && typeof val === 'string' && !isEmpty(delimiters)) {
      val = val.trim();

      if (isEmpty(val)) {
        return predicate;
      }

      if (val[0] === '`' && val[val.length - 1] === '`') {
        predicate.val = val.slice(1, val.length - 1);
        return predicate;
      }

      const result = JournalsConverter._splitStringByDelimiters(val, delimiters);

      return {
        t: PREDICATE_OR,
        val: result.map(
          val =>
            new Predicate({
              ...predicate,
              val
            })
        )
      };
    }

    return predicate;
  }

  static _splitStringByDelimiters(string, delimiters = []) {
    const quote = string.match(/["|'](.*?)["|']/);

    if (quote) {
      return [
        quote[0],
        ...JournalsConverter._splitStringByDelimiters(string.slice(0, quote.index), delimiters),
        ...JournalsConverter._splitStringByDelimiters(string.slice(quote.index + quote[0].length), delimiters)
      ];
    }

    const subStrings = string.split(delimiters[0]).filter(item => !!item.trim());

    if (subStrings.length < 2) {
      return subStrings;
    }

    return subStrings.reduce((result, current) => {
      const text = current.trim();

      if (!text) {
        return result;
      }

      result.push(...JournalsConverter._splitStringByDelimiters(text, delimiters.slice(1)));

      return result;
    }, []);
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

  static filterColumnsByConfig(columns, configColumns) {
    if (isEmpty(columns) || !Array.isArray(columns) || isEmpty(configColumns) || !Array.isArray(configColumns)) {
      return columns;
    }

    const configColumnsIds = (configColumns || []).map(item => item.attribute || item.name || item.schema);

    return columns.filter(item => configColumnsIds.includes(item.attribute || item.name || item.schema));
  }

  static filterPredicatesByConfigColumns(predicate, configColumns) {
    if (Array.isArray(predicate)) {
      predicate.forEach(item => JournalsConverter.filterPredicatesByConfigColumns(item, configColumns));

      return predicate;
    }

    const configColumnsIds = (configColumns || []).map(item => item.attribute || item.name || item.schema);

    if (Array.isArray(predicate.val) && !predicate.att) {
      predicate.val = predicate.val.filter(item => JournalsConverter.filterPredicatesByConfigColumns(item, configColumns));
    }

    if (predicate.att) {
      return configColumnsIds.includes(predicate.att);
    }

    return predicate;
  }
}
