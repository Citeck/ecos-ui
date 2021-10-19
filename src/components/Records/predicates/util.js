import _ from 'lodash';

import { Predicates } from '../../Records/predicates';
import { MapBooleanValues } from '../utils/maps';

export const convertValueByType = (type, value) => {
  switch (type) {
    case Predicates.COLUMN_DATA_TYPE_INT:
      const int = Number(value);
      return Number.isNaN(int) ? null : parseInt(String(int));
    case Predicates.COLUMN_DATA_TYPE_LONG:
    case Predicates.COLUMN_DATA_TYPE_FLOAT:
    case Predicates.COLUMN_DATA_TYPE_DOUBLE:
      const float = Number(value);
      return Number.isNaN(float) ? null : float;
    case Predicates.COLUMN_DATA_TYPE_BOOLEAN:
      const found = _.find(MapBooleanValues, o => (o.strict ? o.input === _.lowerCase(value) : o.input.includes(_.lowerCase(value))));
      return found ? found.output : null;
    case Predicates.COLUMN_DATA_TYPE_TEXT:
      return _.toString(value);
    default:
      return value;
  }
};

export function convertAttributeValues(predicate, columns) {
  const updPredicate = _.cloneDeep(predicate);

  function convert(current) {
    if (_.isArray(current)) {
      current.forEach(item => convert(item));
    } else if (_.isArray(current.val)) {
      current.val.forEach(item => {
        if (!_.isUndefined(item.val)) {
          convert(item);
        }
      });
      current.val = current.val.filter(v => !_.isNull(v.val));
    } else if (_.isObject(current)) {
      const col = columns && columns.find(item => item.attribute === current.att);
      const type = _.get(col, 'type');

      current.val = convertValueByType(type, current.val);
    }
  }

  convert(updPredicate);

  return updPredicate;
}
