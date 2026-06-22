import _ from 'lodash';

import { MapBooleanValues } from '../utils/maps';
import { Predicates } from './index';

export const convertValueByType = (type: any, value: any): any => {
  switch (type) {
    case Predicates.COLUMN_DATA_TYPE_INT:
      const int = Number(value);
      return _.isNil(value) || Number.isNaN(int) ? null : parseInt(String(int));
    case Predicates.COLUMN_DATA_TYPE_LONG:
    case Predicates.COLUMN_DATA_TYPE_FLOAT:
    case Predicates.COLUMN_DATA_TYPE_DOUBLE:
      const float = Number(value);
      return _.isNil(value) || Number.isNaN(float) ? null : float;
    case Predicates.COLUMN_DATA_TYPE_BOOLEAN:
      const found = _.find(MapBooleanValues, o => (o.strict ? o.input === _.lowerCase(value) : o.input.includes(_.lowerCase(value))));
      return found ? found.output : null;
    case Predicates.COLUMN_DATA_TYPE_TEXT:
      return _.toString(value);
    default:
      return value;
  }
};

export function convertAttributeValues(predicate: any, columns?: any[]): any {
  const updPredicate = _.cloneDeep(predicate);

  function convert(current: any): void {
    if (_.isArray(current)) {
      current.forEach((item: any) => convert(item));
    } else if (_.isArray(current.val)) {
      current.val.forEach((item: any) => {
        if (!_.isUndefined(item.val)) {
          convert(item);
        }
      });
      current.val = current.val.filter((v: any) => !_.isNull(v.val));
    } else if (_.isObject(current)) {
      const cur = current as any;
      const col = columns && columns.find((item: any) => item.attribute === cur.att);
      const type = _.get(col, 'type');

      cur.val = convertValueByType(type, cur.val);
    }
  }

  convert(updPredicate);

  return updPredicate;
}
