import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import get from 'lodash/get';
import { getMLValue } from '../../../../../../helpers/util';

const originalCreate = ElementFactory.prototype.create;

ElementFactory.prototype.create = function(elementType, attrs) {
  const mlName = get(attrs, ['businessObject', '$attrs', 'ecos:name_ml']) || get(attrs, ['businessObject', '$attrs', 'name_ml']);

  if (mlName) {
    const text = getMLValue(typeof mlName === 'string' ? JSON.parse(mlName) : mlName);
    attrs.businessObject.name = text;

    if (attrs.businessObject.text) {
      attrs.businessObject.text = text;
    }
  }

  return originalCreate.call(this, elementType, attrs);
};
