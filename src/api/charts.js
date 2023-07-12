import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { PREDICATE_AND, PREDICATE_EQ } from '../components/Records/predicates/predicates';
import { notifyFailure } from '../components/Records/actions/util/actionUtils';
import Records from '../components/Records/Records';
import { ParserPredicate } from '../components/Filters/predicates';
import JournalsConverter from '../dto/journals';

export class ChartsApi {
  getChartData = (typeRef, groupByParams, aggregationParam, selectedPreset) => {
    const _predicate = get(selectedPreset, 'settings.predicate');
    const _predicates = [_predicate];
    const predicate = _predicate ? ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(_predicates))[0] : {};

    const typePredicate = {
      t: PREDICATE_EQ,
      att: '_type',
      val: typeRef
    };

    const [source, journalId] = typeRef.split('@');
    if (!source) {
      console.error('charts-widget.no-source');
      notifyFailure('charts-widget.no-source');
      return;
    }

    const [mainGroupByParam] = groupByParams;

    return Records.query(
      {
        sourceId: `emodel/${journalId}`,
        language: 'predicate',
        sortBy: [{ attribute: this._getSortByAttribute(mainGroupByParam), ascending: true }],
        groupBy: this._getGroupByField(groupByParams),
        query: isEmpty(predicate)
          ? typePredicate
          : {
              t: PREDICATE_AND,
              val: [typePredicate, predicate, ...this._getTimeRangeFilters(groupByParams)]
            }
      },
      {
        aggregationParam: `${aggregationParam}?num`,
        ...this._getAttributes(groupByParams)
      }
    ).then(result => result.records);
  };

  _getGroupByField = groupByParams => {
    return groupByParams.map(param => (param.isDateColumn ? `(date_trunc('${param.dateParam}', ${param.attribute}))` : param.attribute));
  };

  _getTimeRangeFilters = groupByParams => {
    return groupByParams
      .filter(param => param.isDateColumn && param.dateRange)
      .map(param => {
        return {
          t: PREDICATE_EQ,
          att: param.attribute,
          val: param.dateRange
        };
      });
  };

  _getSortByAttribute = (mainGroupByParam = {}) => {
    return mainGroupByParam.isDateColumn
      ? `(date_trunc('${mainGroupByParam.dateParam}', ${mainGroupByParam.attribute}))`
      : mainGroupByParam.attribute;
  };

  _getAttributes = groupByParams => {
    return groupByParams.reduce(
      (res, cur) => ({
        ...res,
        [cur.attribute]: cur.isDateColumn ? `(date_trunc('${cur.dateParam}', ${cur.attribute}))` : cur.attribute
      }),
      {}
    );
  };
}
