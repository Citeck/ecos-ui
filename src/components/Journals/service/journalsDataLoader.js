import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

import { ParserPredicate } from '../../Filters/predicates';
import Records from '../../Records';
import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_EQ, PREDICATE_OR } from '../../Records/predicates/predicates';
import { convertAttributeValues } from '../../Records/predicates/util';
import * as RecordUtils from '../../Records/utils/recordUtils';

import computedService from './computed/computedService';
import journalsServiceApi from './journalsServiceApi';
import { COMPUTED_ATT_PREFIX } from './util';

import { Attributes } from '@/constants';
import JournalsConverter from '@/dto/journals';
import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces, t } from '@/helpers/util';
import AttributesService from '@/services/AttributesService';
import { NotificationManager } from '@/services/notifications';

class JournalsDataLoader {
  /**
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {Promise}
   */
  async load(journalConfig, settings = {}) {
    const recordsQuery = await this.getRecordsQuery(journalConfig, settings);
    const attributes = this._getAttributes(journalConfig, settings);

    return journalsServiceApi
      .queryData(recordsQuery, attributes.attributesSet)
      .then(res => ({ ...res, query: recordsQuery }))
      .then(resArg => {
        const result = { ...resArg };
        const resultRecords = [];
        const records = result.records || [];
        const attributesMap = attributes.attributesMap;
        const computedPromises = [];

        for (let record of records) {
          const newRecord = {
            id: record.id,
            // attributes as is without aliases
            rawAttributes: {
              recordRef: record.id,
              '?id': record.id,
              ...record
            }
          };

          const recordComputed = get(journalConfig, 'configData.recordComputed');
          if (recordComputed && recordComputed.length) {
            computedPromises.push(computedService.resolve(recordComputed, newRecord.rawAttributes));
          }

          const configComputed = get(journalConfig, 'configData.configComputed');
          if (configComputed) {
            for (let key in configComputed) {
              if (configComputed.hasOwnProperty(key)) {
                newRecord.rawAttributes[COMPUTED_ATT_PREFIX + key] = configComputed[key];
              }
            }
          }

          for (let key in attributesMap) {
            if (attributesMap.hasOwnProperty(key)) {
              newRecord[key] = record[attributesMap[key]];
            }
          }

          resultRecords.push(newRecord);
        }

        return Promise.all(computedPromises).then(computedResults => {
          for (let idx = 0; idx < computedResults.length; idx++) {
            const computedAttributes = computedResults[idx];
            const recordRawAtts = resultRecords[idx].rawAttributes;

            for (let key in computedAttributes) {
              if (computedAttributes.hasOwnProperty(key)) {
                recordRawAtts[COMPUTED_ATT_PREFIX + key] = computedAttributes[key];
              }
            }
          }

          result.records = resultRecords;

          return result;
        });
      });
  }

  /**
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {RecordsQuery}
   */
  getRecordsQuery = async (journalConfig, settings = {}) => {
    const consistency = 'EVENTUAL';
    const columns = journalConfig.columns || settings.columns || [];
    const predicates = await this.getPredicates(journalConfig, settings);

    let language = 'predicate';
    let query = JournalsConverter.optimizePredicate({ t: PREDICATE_AND, val: predicates });
    const sourceId = settings.customSourceId || journalConfig.sourceId || '';
    let queryData = null;
    const currentColoumns = JournalsConverter.getColoumnByPredicates(query, columns);

    const innerResult = {};
    for (const [columnKey, columnValue] of Object.entries(currentColoumns)) {
      const { result, predicate } = columnValue;
      const columnRefs = await this.getSearchRecordRefsFromColumn(result, predicate, sourceId);
      innerResult[columnKey] = columnRefs;
    }

    let searchAttribute;
    const searchConfig = JournalsConverter.getSearchConfig(query, columns);
    if (searchConfig && !isEmpty(searchConfig.searchAttribute)) {
      searchAttribute = searchConfig.searchAttribute;
    }

    const innerPredicates = Object.keys(innerResult)
      .filter(key => !isEmpty(innerResult[key]))
      .map(key => ({
        t: PREDICATE_OR,
        val: innerResult[key].map(val => ({ t: PREDICATE_EQ, att: searchAttribute || key, val }))
      }));

    query = JournalsConverter.searchConfigProcessed(query, columns);

    if (innerPredicates.length) {
      const newQuery = { t: PREDICATE_AND, val: innerPredicates };
      query = { t: PREDICATE_AND, val: [query, newQuery] };
    }

    if (journalConfig.queryData || settings.queryData) {
      queryData = {
        ...(journalConfig.queryData || {}),
        ...(settings.queryData || {})
      };
    }

    if (queryData && Object.keys(queryData).length > 0) {
      query = {
        data: queryData,
        predicate: query
      };
      language = 'predicate-with-data';
    }

    const sortBy = this._getSortBy(journalConfig, settings);
    const groupBy = this._getGroupBy(journalConfig, settings);

    if (getEnabledWorkspaces()) {
      const workspaces = !get(settings, 'workspaces') ? [getWorkspaceId()] : settings.workspaces;

      return {
        sourceId,
        language,
        consistency,
        query,
        page: settings.page,
        sortBy,
        groupBy,
        workspaces
      };
    }

    return {
      sourceId,
      language,
      consistency,
      query,
      page: settings.page,
      sortBy,
      groupBy
    };
  };

  /**
   *
   * @param {column} column
   * @returns {RecordRef[]}
   */
  getSearchRecordRefsFromColumn = async (column, predicate, parentSourceId = '') => {
    const searchConfig = get(column, 'searchConfig.searchByText');
    if (!searchConfig || !Object.keys(searchConfig).length) {
      return [];
    }

    const innerQuery = searchConfig.innerQuery;

    if (isEmpty(innerQuery)) {
      return [];
    }

    const language = 'predicate';
    const replaceMap = {
      $TEXT: get(predicate, 'val'),
      $PREDICATE_TYPE: get(predicate, 't')
    };
    const innerQueryCopy = cloneDeep(innerQuery);
    const query = this.recoursiveReplaceObjectValues(innerQueryCopy, replaceMap);
    const maxItems = get(query, 'page.maxItems') || 20;

    try {
      const result = await Records.query({
        ...query,
        sourceId: query.sourceId || parentSourceId,
        page: {
          maxItems: maxItems + 1
        },
        language
      });

      const records = result.records;

      if (records && records.length === maxItems + 1) {
        NotificationManager.warning(t('journal.not-accurate-filter', { column: column.label }));
        records.pop();
      }

      return records;
    } catch (err) {
      NotificationManager.error(t('journal.filter.error', { column: column.label }));
    }

    return [];
  };

  recoursiveReplaceObjectValues = (obj, replaceMap = {}) => {
    if (!Object.keys(replaceMap).length) {
      return obj;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        obj[key] = this.recoursiveReplaceObjectValues(value, replaceMap);
      }

      if (isObject(value)) {
        obj[key] = this.recoursiveReplaceObjectValues(value, replaceMap);
      }

      if (replaceMap[value] !== undefined) {
        obj[key] = replaceMap[value];
      }
    }

    return obj;
  };

  /**
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {Promise<Array<Predicate>>}}
   */
  getPredicates = async (journalConfig, settings) => {
    const columns = journalConfig.columns || settings.columns || [];
    const predicateFilter = convertAttributeValues(
      filter(settings.filter, p => !!p),
      columns
    );

    let predicates = [journalConfig.predicate, settings.predicate, ...(settings.predicates || []), ...predicateFilter].filter(p => !!p);

    if (settings.onlyLinked && settings.recordRef && isArray(settings.attrsToLoad)) {
      const attrsToLoad = settings.attrsToLoad.map(attr => attr.value);

      predicates.push({
        t: PREDICATE_OR,
        val: columns
          .filter(c => c.type === COLUMN_DATA_TYPE_ASSOC && c.searchable && attrsToLoad.includes(c.attribute))
          .map(a => ({
            t: PREDICATE_CONTAINS,
            val: settings.recordRef,
            att: a.attribute
          }))
      });

      predicates = await RecordUtils.replaceAttrValuesForRecord(predicates, settings.recordRef);
    }

    return ParserPredicate.replacePredicatesType(predicates);
  };

  /**
   * @private
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {SortBy}
   */
  _getSortBy = (journalConfig, settings) => {
    let sortBy = [];

    if (Array.isArray(settings.sortBy)) {
      sortBy = settings.sortBy;
    } else if (typeof settings.sortBy === 'object' && Object.keys(settings).length) {
      sortBy = [settings.sortBy];
    }

    if (!sortBy.length) {
      sortBy = journalConfig.sortBy || [];
    }

    sortBy = sortBy.filter(s => !!s.attribute);

    if (!sortBy.length) {
      sortBy = [{ attribute: Attributes.CREATED, ascending: false }];
    }

    return sortBy;
  };

  /**
   * @private
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {?Array<String>}
   */
  _getGroupBy = (journalConfig, settings) => {
    const groupBy = settings.groupBy || journalConfig.groupBy;

    if (groupBy && groupBy.length) {
      return groupBy;
    }
  };

  /**
   * @private
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {{attributesMap: Object, attributesSet: Array}}
   */
  _getAttributes = (journalConfig, settings) => {
    const columns = journalConfig.columns || [];
    const settingsColumns = settings.columns || [];
    const settingsAttributes = settings.attributes || {};
    const attributesMap = {};
    let groupBy = journalConfig.groupBy || [];

    if (isEmpty(groupBy)) {
      groupBy = settings.groupBy || [];
    }

    for (let column of columns) {
      if (!column.attribute.startsWith('_custom_')) {
        !!column.name && (attributesMap[column.name] = column.attSchema);
        !!column.attribute && (attributesMap[column.attribute] = column.attSchema);
      }
    }

    for (let item of settingsColumns) {
      if (!item.attribute.startsWith('_custom_')) {
        !!item.column && (attributesMap[item.attribute] = item.schema);
      }
    }

    for (let att in settingsAttributes) {
      if (settingsAttributes.hasOwnProperty(att)) {
        attributesMap[att] = settingsAttributes[att];
      }
    }

    if (groupBy.length) {
      AttributesService.getGroupBy(groupBy, attributesMap);
    }

    const attributesSet = new Set();

    for (let key in attributesMap) {
      if (attributesMap.hasOwnProperty(key)) {
        attributesSet.add(attributesMap[key]);
      }
    }

    const additionalAttributes = get(journalConfig, 'configData.attributesToLoad');

    if (additionalAttributes) {
      for (let att of additionalAttributes) {
        attributesSet.add(att);
      }
    }

    return {
      attributesMap: attributesMap,
      attributesSet: [...attributesSet]
    };
  };
}

const INSTANCE = new JournalsDataLoader();
export default INSTANCE;
