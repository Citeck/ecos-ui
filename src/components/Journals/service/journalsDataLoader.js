import journalsServiceApi from './journalsServiceApi';
import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../../Records/predicates/predicates';
import lodash from 'lodash';

const isPredicateValid = predicate => {
  return !!(predicate && predicate.t);
};

const optimizePredicate = predicate => {
  if (!isPredicateValid(predicate)) {
    return {};
  }
  if (predicate.t === 'and' || predicate.t === 'or') {
    let predicates = (predicate.val || []).map(pred => optimizePredicate(pred)).filter(isPredicateValid);

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
  return lodash.cloneDeep(predicate);
};

class JournalsDataLoader {
  async load(journalConfig, settings) {
    const columns = journalConfig.columns || [];

    const predicates = [journalConfig.predicate, settings.predicate];
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
    }

    //todo: replace placeholders in predicates

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

    let groupBy = journalConfig.groupBy || settings.groupBy;
    if (groupBy && groupBy.length) {
      recordsQuery.groupBy = groupBy;
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
