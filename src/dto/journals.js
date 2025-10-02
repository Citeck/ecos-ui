import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';
import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';
import set from 'lodash/set';

import { ParserPredicate } from '../components/Filters/predicates';
import Predicate from '../components/Filters/predicates/Predicate';
import { PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../components/Records/predicates/predicates';
import { GROUPING_COUNT_ALL } from '../constants/journal';
import { getId } from '../helpers/util';
import AttributesService from '../services/AttributesService';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

export default class JournalsConverter {
  static cleanUpPredicate(predicate) {
    return ParserPredicate.removeEmptyPredicates(cloneDeep(predicate));
  }

  /**
   * @param {Predicate|Array<Predicate>} predicate
   * @param {Array<Column>} columns
   * @returns {Object|*}
   */
  static getSearchConfig(predicate, columns) {
    const attribute = get(predicate, 'att', get(predicate, 'a'));
    let searchConfig = get(
      find(columns, column => JournalsConverter.getColumnId(column) === attribute),
      'searchConfig'
    );

    let val = get(predicate, 'val', get(predicate, 'v'));

    if (!searchConfig && Array.isArray(val)) {
      for (const item of val) {
        searchConfig = JournalsConverter.getSearchConfig(item, columns);
        if (searchConfig && !isEmpty(searchConfig.searchAttribute)) {
          break;
        }
      }
    }

    return searchConfig;
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
    const searchConfig = get(
      find(columns, column => JournalsConverter.getColumnId(column) === attribute),
      'searchConfig'
    );

    let val = get(predicate, 'val', get(predicate, 'v'));

    if (searchConfig && !isEmpty(searchConfig.searchAttribute)) {
      if (get(predicate, 'a')) {
        set(predicate, 'a', searchConfig.searchAttribute);
      }

      if (get(predicate, 'att')) {
        set(predicate, 'att', searchConfig.searchAttribute);
      }
    }

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

    const delimiters = get(searchConfig, 'delimiters');

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
   * @param {string} predicate
   * @param {Array<string>} columns
   *
   * @returns {?Column}
   */
  static getColoumnByPredicates(predicate, columns) {
    const val = get(predicate, 'val', get(predicate, 'v'));

    if (Array.isArray(val)) {
      const allColumnsByPredicate = val.map(item => JournalsConverter.getColoumnByPredicates(item, columns));
      return allColumnsByPredicate.reduce((res, cur) => ({ ...res, ...cur }), {});
    }

    const attribute = get(predicate, 'att', get(predicate, 'a'));

    const result = find(columns, column => JournalsConverter.getColumnId(column) === attribute);
    return result === undefined ? {} : { [attribute]: { result, predicate } };
  }

  /**
   * @param {string} string
   * @param {Array<string>} delimiters
   * @returns {Array<string>}
   * @private
   */
  static _splitStringByDelimiters(string, delimiters = []) {
    string = (string || '').trim();

    if (isEmpty(delimiters) || isEmpty(string)) {
      return [string];
    }

    if (string[0] === '`' && string[string.length - 1] === '`') {
      return [string.slice(1, string.length - 1)];
    }

    const regPattern = `${delimiters[0]}(?=(?:[^'"]|'[^']*'|"[^"]*")*$)`;
    const regExp = new RegExp(regPattern, 'g');
    const splittingResult = string.split(regExp);

    if (splittingResult.length) {
      return splittingResult
        .reduce((prev, str) => {
          const result = this._splitStringByDelimiters(str, delimiters.slice(1));

          prev.push(...result);

          return prev;
        }, [])
        .filter(item => !!item.trim());
    }

    return [string];
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

    target.attrsToLoad = _source.attrsToLoad;
    target.customSourceId = _source.sourceId;
    target.predicate = _source.predicate;
    target.onlyLinked = !!_source.onlyLinked;
    target.isCustomJournalMode = !!_source.customJournalMode;
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

    return columns
      .filter(item => {
        const column = item.column;

        // TODO: add constants like DynamicColumns
        if (column === GROUPING_COUNT_ALL) {
          return true;
        }

        if (isString(column) && column.startsWith('_custom_')) {
          return true;
        }

        return configColumnsIds.includes(column || JournalsConverter.getColumnId(item));
      })
      .map(item => {
        const id = JournalsConverter.getColumnId(item);
        const attribute = item.column || item.attribute;
        const originColumn = configColumns.find(column => column.attribute === attribute && id.includes(attribute));

        if (!originColumn) {
          return item;
        }
        // TODO: remove all props from modal settings
        return {
          ...item,
          newFormatter: originColumn.newFormatter,
          newEditor: originColumn.newEditor,
          sortable: originColumn.sortable
        };
      });
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
