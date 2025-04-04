import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import get from 'lodash/get';
import isUndefined from 'lodash/isUndefined';
import set from 'lodash/set';

import { ML_POSTFIX, PREFIX_FIELD } from '@/constants/cmmn';
import { getRecordRef } from '@/helpers/urls';
import { getMLValue } from '@/helpers/util';

const originalCreate = ElementFactory.prototype.create;

ElementFactory.prototype.create = function (elementType, attrs) {
  const mlFieldName = `name${ML_POSTFIX}`;
  const mlName =
    get(attrs, ['businessObject', '$attrs', `${PREFIX_FIELD}${mlFieldName}`]) || get(attrs, ['businessObject', '$attrs', mlFieldName]);

  if (mlName) {
    const text = getMLValue(typeof mlName === 'string' ? JSON.parse(mlName) : mlName);

    set(attrs, 'businessObject.name', text);

    if (!isUndefined(get(attrs, 'businessObject.text'))) {
      set(attrs, 'businessObject.text', text);
    }
  }

  set(attrs, 'recordRef', getRecordRef());

  return originalCreate.call(this, elementType, attrs);
};
