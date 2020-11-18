import get from 'lodash/get';
import Base from 'formiojs/components/base/Base';
import NestedComponent from 'formiojs/components/nested/NestedComponent';

import { FORM_MODE_CREATE } from '../../../../components/EcosForm/constants';

NestedComponent.prototype.checkConditions = function(data) {
  const result = Base.prototype.checkConditions.call(this, data);

  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2967
  if (result) {
    this.getComponents().forEach(comp => comp.checkConditions(data));
  }

  return result;
};

NestedComponent.prototype.setNestedValue = function(component, value, flags, changed) {
  if (component.type === 'button') {
    return false;
  }
  if (component.type === 'components') {
    return component.setValue(value, flags) || changed;
  } else if (value && component.hasValue(value)) {
    return component.setValue(get(value, component.key), flags) || changed;
  } else {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-664
    const formMode = get(this.options, 'formMode');
    if (formMode && formMode !== FORM_MODE_CREATE) {
      return false;
    }

    flags.noValidate = true;
    return component.setValue(component.defaultValue, flags) || changed;
  }
};

export default NestedComponent;
