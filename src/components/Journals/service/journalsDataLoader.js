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
  async load(journalConfig, settings = {}) {
    const columns = journalConfig.columns || [];
    let predicates = [journalConfig.predicate, settings.predicate, ...(settings.filter || [])];

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

    let language = 'predicate';
    let query = JournalsConverter.optimizePredicate({ t: PREDICATE_AND, val: predicates });

    query = convertAttributeValues(query, columns);

    let queryData = null;
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

    const recordsQuery = {
      sourceId: settings.customSourceId || journalConfig.sourceId,
      query,
      language,
      page: settings.page,
      consistency: 'EVENTUAL'
    };

    const groupBy = settings.groupBy || journalConfig.groupBy;
    if (groupBy && groupBy.length) {
      recordsQuery.groupBy = groupBy;
    }

    let sortBy = settings.sortBy || [];
    if (!sortBy.length) {
      sortBy = journalConfig.sortBy || [];
    }
    if (!sortBy.length && recordsQuery.sourceId === '') {
      sortBy = [
        {
          attribute: Attributes.DBID,
          ascending: false
        }
      ];
    }
    recordsQuery.sortBy = sortBy;

    const attributes = this._getAttributes(journalConfig, settings);

    return journalsServiceApi
      .queryData(recordsQuery, attributes.attributesSet)
      .then(res => ({
        ...res,
        query: recordsQuery
      }))
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
          const recordComputed = journalConfig.configData.recordComputed;
          if (recordComputed && recordComputed.length) {
            computedPromises.push(computedService.resolve(recordComputed, newRecord.rawAttributes));
          }
          const configComputed = journalConfig.configData.configComputed;
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

  _getAttributes(journalConfig, settings) {
    const groupBy = journalConfig.groupBy || [];
    const columns = journalConfig.columns || [];
    const settingsAttributes = settings.attributes || {};
    const attributesMap = {};

    for (let column of columns) {
      attributesMap[column.name] = column.attSchema;
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

    const additionalAttributes = journalConfig.configData.attributesToLoad;
    if (additionalAttributes) {
      for (let att of additionalAttributes) {
        attributesSet.add(att);
      }
    }

    return {
      attributesMap: attributesMap,
      attributesSet: [...attributesSet]
    };
  }
}

const INSTANCE = new JournalsDataLoader();
export default INSTANCE;
