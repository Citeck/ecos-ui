import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';
import get from 'lodash/get';
import find from 'lodash/find';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import Predicate from '../components/Filters/predicates/Predicate';
import AttributesService from '../services/AttributesService';
import { ParserPredicate } from '../components/Filters/predicates';
import { PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../components/Records/predicates/predicates';
import { getId } from '../helpers/util';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

export default class JournalsConverter {
  static cleanUpPredicate(predicate) {
    return ParserPredicate.removeEmptyPredicates(cloneDeep(predicate));
  }

  /**
   * @param {Column} column
   * @returns {?string}
   */
  static getColumnId(column) {
    if (isEmpty(column)) {
      return undefined;
    }

    return column.attribute || column.name || column.schema;
  }

  /**
   * Get processed predicate with search configuration
   * @param {Predicate|Array<Predicate>} predicate
   * @param {Array<Column>} columns
   * @returns {Predicate|*}
   */
  static searchConfigProcessed(predicate, columns) {
    if (isEmpty(predicate)) {
      return {};
    }

    if (isEmpty(columns)) {
      return predicate;
    }

    const attribute = get(predicate, 'att', get(predicate, 'a'));
    const delimiters = get(find(columns, column => JournalsConverter.getColumnId(column) === attribute), 'searchConfig.delimiters');
    let val = get(predicate, 'val', get(predicate, 'v'));

    if (Array.isArray(val)) {
      return {
        ...predicate,
        val: val.map(item => JournalsConverter.searchConfigProcessed(item, columns))
      };
    }

    if (predicate.t !== PREDICATE_CONTAINS || typeof val !== 'string') {
      return predicate;
    }

    val = val.trim();
    predicate.val = val;

    if (isEmpty(val)) {
      return predicate;
    }

    if (val[0] === '`' && val[val.length - 1] === '`') {
      predicate.val = val.slice(1, val.length - 1);
      return predicate;
    }

    if (isEmpty(delimiters)) {
      return predicate;
    }

    const result = JournalsConverter._splitStringByDelimiters(val, delimiters);

    if (result.length < 2) {
      return predicate;
    }

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

  /**
   * @param {string} string
   * @param {Array<string>} delimiters
   * @returns {Array<string>}
   * @private
   */
  static _splitStringByDelimiters(string, delimiters = []) {
    if (string[0] === '`' && string[string.length - 1] === '`') {
      return [string.slice(1, string.length - 1)];
    }

    const quote = string.match(/["|'](.*?)["|']/);

    if (
      isEmpty(delimiters) ||
      !delimiters.some((symbol, index) => {
        let str = string;

        if (quote) {
          str = string.slice(0, quote.index) + string.slice(quote.index + quote[0].length);
        }

        return str.includes(symbol);
      })
    ) {
      return [string];
    }

    if (quote) {
      return [
        quote[0],
        ...JournalsConverter._splitStringByDelimiters(string.slice(0, quote.index), delimiters),
        ...JournalsConverter._splitStringByDelimiters(string.slice(quote.index + quote[0].length), delimiters)
      ].filter(str => !!str);
    }

    const subStrings = string.split(delimiters[0]).filter(item => !!item.trim());

    if (subStrings.length < 2 && isEmpty(delimiters)) {
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

    if (predicate.t === PREDICATE_AND || predicate.t === PREDICATE_OR) {
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

  /**
   * @param {Object} source
   * @returns {JournalSettings}
   */
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

  /**
   * @param {Object} source
   * @returns {RecordsActionsRes}
   */
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

    const configColumnsIds = (configColumns || []).map(item => JournalsConverter.getColumnId(item));

    return columns.filter(item => configColumnsIds.includes(JournalsConverter.getColumnId(item)));
  }

  /**
   *
   * @param {Predicate|Array<Predicate>} predicate
   * @param {Array} configColumns
   * @returns {Predicate|Array<Predicate>}
   */
  static filterPredicatesByConfigColumns(predicate, configColumns) {
    if (Array.isArray(predicate)) {
      predicate.forEach(item => JournalsConverter.filterPredicatesByConfigColumns(item, configColumns));

      return predicate;
    }

    const configColumnsIds = (configColumns || []).map(item => JournalsConverter.getColumnId(item));

    if (Array.isArray(predicate.val) && !predicate.att) {
      predicate.val = predicate.val.filter(item => JournalsConverter.filterPredicatesByConfigColumns(item, configColumns));
    }

    if (predicate.att) {
      return configColumnsIds.includes(predicate.att);
    }

    return predicate;
  }
}
