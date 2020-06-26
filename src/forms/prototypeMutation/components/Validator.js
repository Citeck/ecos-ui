import FormioValidator from 'formiojs/components/Validator';
import { boolValue } from 'formiojs/utils/utils';

FormioValidator.validators.required = {
  ...FormioValidator.validators.required,
  check(component, setting, value) {
    if (!boolValue(setting)) {
      return true;
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-192
    return component.disabled || !component.isEmpty(value);
  }
};
