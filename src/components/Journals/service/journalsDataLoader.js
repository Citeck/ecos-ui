import get from 'lodash/get';
import filter from 'lodash/filter';

import { Attributes } from '../../../constants';
import AttributesService from '../../../services/AttributesService';
import JournalsConverter from '../../../dto/journals';
import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../../Records/predicates/predicates';
import { convertAttributeValues } from '../../Records/predicates/util';
import * as RecordUtils from '../../Records/utils/recordUtils';
import journalsServiceApi from './journalsServiceApi';
import computedService from './computed/computedService';
import { COMPUTED_ATT_PREFIX } from './util';

class JournalsDataLoader {
  /**
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {Promise}
   */
  async load(journalConfig, settings = {}) {
    const recordsQuery = await this.getRecordsQuery(journalConfig, settings);
    const attributes = this.#getAttributes(journalConfig, settings);

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
    let queryData = null;

    query = JournalsConverter.searchConfigProcessed(query, columns);

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

    const sortBy = this.#getSortBy(journalConfig, settings);
    const groupBy = this.#getGroupBy(journalConfig, settings);

    return {
      sourceId: settings.customSourceId || journalConfig.sourceId || '',
      language,
      consistency,
      query,
      page: settings.page,
      sortBy,
      groupBy
    };
  };

  /**
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {Promise<Array<Predicate>>}}
   */
  getPredicates = async (journalConfig, settings) => {
    const columns = journalConfig.columns || settings.columns || [];
    const predicateFilter = convertAttributeValues(filter(settings.filter, p => !!p), columns);

    let predicates = [journalConfig.predicate, settings.predicate, ...predicateFilter].filter(p => !!p);

    if (settings.onlyLinked && settings.recordRef) {
      predicates.push({
        t: PREDICATE_OR,
        val: columns
          .filter(c => c.type === COLUMN_DATA_TYPE_ASSOC && c.searchable)
          .map(a => ({
            t: PREDICATE_CONTAINS,
            val: settings.recordRef,
            att: a.attribute
          }))
      });

      predicates = await RecordUtils.replaceAttrValuesForRecord(predicates, settings.recordRef);
    }

    return predicates;
  };

  /**
   * @private
   * @param {JournalConfig} journalConfig
   * @param {JournalSettings} settings
   * @returns {SortBy}
   */
  #getSortBy = (journalConfig, settings) => {
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
  #getGroupBy = (journalConfig, settings) => {
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
  #getAttributes = (journalConfig, settings) => {
    const groupBy = journalConfig.groupBy || [];
    const columns = journalConfig.columns || [];
    const settingsAttributes = settings.attributes || {};
    const attributesMap = {};

    for (let column of columns) {
      !!column.name && (attributesMap[column.name] = column.attSchema);
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
