import { GROUPING_COUNT_ALL } from '@citeck/constants/journal';
import { PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '@citeck/records-core/predicates/predicates';
import { convertAttributeValues } from '@citeck/records-core/predicates/util';
import { ParserPredicate, Predicate } from '@citeck/records-predicates';
import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';
import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';
import set from 'lodash/set';

import { getId } from '../helpers/util';
import AttributesService from '../services/AttributesService';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

/**
 * Query behind the total sum in the journal table footer.
 *
 * The sum must count exactly the rows the table counts, and the only object that is guaranteed to
 * describe that set is the query the table has ALREADY run: `journalsDataLoader.getRecordsQuery`
 * builds it, the loader returns it and `setGrid` keeps it in `grid.query`. Re-deriving it from parts
 * is what the footer used to do, and it was wrong in every part the footer did not know about — the
 * record source was GUESSED from the journal type ref (`type@x` -> `emodel/x`, which misses for a
 * third of the journals on a stand: those answered `{"records":[]}` and the footer went silently
 * empty), while the header search predicate, the "only linked" filter, the category, the inner-query
 * sub-selects and the whole `predicate-with-data` payload were simply absent.
 *
 * So the main path builds nothing. It takes the executed query and changes only what turns a page
 * request into an aggregate: `page` and `sortBy` are dropped, `groupBy` becomes `['*']`. `sourceId`,
 * `language` (`predicate-with-data` included, together with its `data` payload), `consistency`,
 * `workspaces` and the predicate travel AS IS. The predicate especially is NOT re-normalized: it has
 * already been through the table pipeline, and running a foreign predicate through the
 * empty-predicate cleanup can invert its OR branches — emptiness is `true` under AND and `false`
 * under OR (`packages/records-predicates/src/utils.ts`, and the same reasoning in the docblock of
 * `buildColumnSumQuery`).
 *
 * `ecosType` is deliberately NOT added: uiserv always bakes `eq(_type, <typeRef>)` into the
 * predicate of a resolved journal, and `ecosType` on top of that would need the BARE local id of the
 * type — a full ref there silently matches nothing.
 *
 * The fallback path serves the single caller that has no query it can trust (`sagaOpenSelectedPreset`
 * reads the grid BEFORE the preset is applied, so `grid.query` still belongs to the previous preset).
 * It reproduces today's shape — plain `predicate` language, `groupBy: ['*']`, the predicates cleaned
 * and type-normalized the way the saga has always cleaned them — with the source HANDED IN by the
 * caller instead of guessed. `workspaces` is an argument for the same reason: no store, no url, no
 * globals here, so the builder stays pure and testable.
 *
 * Without a source there is nothing honest to ask for: return null and leave the footer empty. An
 * empty footer is more truthful than a sum over someone else's source.
 *
 * @param {Object} params
 * @param {?Object} [params.gridQuery] records query the table has actually run (`grid.query`)
 * @param {?string} [params.sourceId] record source for the fallback path
 * @param {Array<*>} [params.predicates] predicates for the fallback path
 * @param {Array<*>} [params.columns] columns the fallback predicates are converted against
 * @param {Array<string>} [params.workspaces] workspaces for the fallback path
 * @returns {?Object} records query, or null when there is no source to ask
 */
export function buildTotalSumQuery({ gridQuery, sourceId, predicates, columns, workspaces } = {}) {
  if (gridQuery && gridQuery.sourceId) {
    const { page, sortBy, ...rest } = gridQuery;

    return { ...rest, groupBy: ['*'] };
  }

  if (!sourceId) {
    return null;
  }

  const cleanPredicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(predicates || []));

  return {
    sourceId,
    query: JournalsConverter.optimizePredicate({ t: PREDICATE_AND, val: convertAttributeValues(cleanPredicates, columns) }),
    language: 'predicate',
    groupBy: ['*'],
    workspaces
  };
}

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
   * @param {JournalColumnType} column
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

    if (_source.workspaces) {
      target.workspaces = _source.workspaces;
    }

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
   * @param {PredicateType|Array<PredicateType>} predicate
   * @param {Array} configColumns
   * @returns {PredicateType|Array<PredicateType>}
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

  static mapPredicateKeys(predicate, mapping) {
    if (!predicate) {
      return;
    }
    if (Array.isArray(predicate)) {
      for (let elem of predicate) {
        this.mapPredicateKeys(elem, mapping);
      }
      return;
    }
    let predType = predicate['t'];
    if (!predType) {
      return;
    }
    if (predType === 'and' || predType === 'or' || predType === 'not') {
      this.mapPredicateKeys(predicate['val'] || predicate['v'], mapping);
    } else {
      let attKey = 'a';
      if (!predicate.hasOwnProperty(attKey)) {
        attKey = 'att';
      }
      let newAttName = mapping[predicate[attKey] || ''];
      if (newAttName) {
        predicate[attKey] = newAttName;
      }
    }
  }
}
