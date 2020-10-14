import get from 'lodash/get';

import { Attributes } from '../../../constants';
import AttributesService from '../../../services/AttributesService';
import JournalsConverter from '../../../dto/journals';
import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../../Records/predicates/predicates';
import * as AttributeUtils from '../../Records/utils/attStrUtils';
import * as RecordUtils from '../../Records/utils/recordUtils';
import journalsServiceApi from './journalsServiceApi';

class JournalsDataLoader {
  async load(journalConfig, settings) {
    const columns = journalConfig.columns || [];
    let predicates = [journalConfig.predicate, settings.predicate, ...settings.filter];

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

    query = AttributeUtils.convertAttributeValues(query, columns);

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

    const sortBy = settings.sortBy || journalConfig.sortBy;
    recordsQuery.sortBy = [
      {
        attribute: get(sortBy, 'attribute') || Attributes.DBID,
        ascending: !!get(sortBy, 'ascending')
      }
    ];

    const attributes = this._getAttributes(journalConfig, settings);

    return journalsServiceApi.queryData(recordsQuery, attributes).then(res => ({
      ...res,
      query: recordsQuery
    }));
  }

  _getAttributes(journalConfig, settings) {
    const groupBy = journalConfig.groupBy || [];
    const columns = journalConfig.columns || [];
    const settingsAttributes = settings.attributes || {};
    const attributes = {};

    for (let column of columns) {
      attributes[column.name] = column.attSchema;
    }

    for (let att in settingsAttributes) {
      if (settingsAttributes.hasOwnProperty(att)) {
        attributes[att] = settingsAttributes[att];
      }
    }

    if (groupBy.length) {
      AttributesService.getGroupBy(groupBy, attributes);
    }

    return attributes;
  }
}

const INSTANCE = new JournalsDataLoader();
export default INSTANCE;
