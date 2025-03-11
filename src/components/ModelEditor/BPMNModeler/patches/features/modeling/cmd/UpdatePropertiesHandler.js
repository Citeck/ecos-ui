import UpdatePropertiesHandler from 'bpmn-js/lib/features/modeling/cmd/UpdatePropertiesHandler';
import get from 'lodash/get';

import { PREFIX_FIELD } from '@/constants/cmmn';

const originalExecute = UpdatePropertiesHandler.prototype.execute;

UpdatePropertiesHandler.prototype.execute = function (context, withClear) {
  const element = context.element;
  const translate = this._translate;

  if (!element) {
    throw new Error(translate('element required'));
  }

  context.element.businessObject = context.element.businessObject || context.element;

  if (context.withClear && get(context, 'element.type') === get(context, 'element.businessObject.$type')) {
    const elementAttrs = get(context, 'element.businessObject.$attrs', {});
    const propertiesKeys = Object.keys(context.properties);
    const notInclidedAttrs = Object.keys(elementAttrs)
      .filter((property) => !propertiesKeys.includes(property) && property.startsWith(PREFIX_FIELD))
      .reduce((res, current) => ({ ...res, [current]: '' }), {});

    context.properties = { ...context.properties, ...notInclidedAttrs };
  }

  return originalExecute.call(this, context);
};
