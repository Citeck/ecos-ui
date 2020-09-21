import cloneDeep from 'lodash/cloneDeep';

import { Attributes } from '../../../constants';
import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../../common/form/SelectJournal/predicates';
import * as RecordUtils from '../../Records/utils/recordUtils';
import journalsServiceApi from './journalsServiceApi';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

const optimizePredicate = predicate => {
  if (!isPredicateValid(predicate)) {
    return {};
  }

  if (predicate.t === 'and' || predicate.t === 'or') {
    const predicates = (predicate.val || []).map(pred => optimizePredicate(pred)).filter(isPredicateValid);

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
};

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
    let query = optimizePredicate({
      t: PREDICATE_AND,
      val: predicates
    });

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
      sourceId: journalConfig.sourceId,
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
    if (sortBy && sortBy.length) {
      recordsQuery.sortBy = sortBy;
    } else {
      recordsQuery.sortBy = [{ attribute: Attributes.DBID, ascending: false }];
    }

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
      for (let att of groupBy) {
        attributes['groupBy_' + att] = att + '?str';
      }
    }

    return attributes;
  }
}

const INSTANCE = new JournalsDataLoader();
export default INSTANCE;
