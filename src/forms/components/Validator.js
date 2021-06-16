import isBoolean from 'lodash/isBoolean';
import FormioValidator from 'formiojs/components/Validator';
import { boolValue } from 'formiojs/utils/utils';

FormioValidator.validators.required = {
  ...FormioValidator.validators.required,
  check(component, setting, value) {
    if (!boolValue(setting)) {
      return true;
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-192
    let disabled = component._disabled;
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-314
    if (component.component && isBoolean(component.component.disabled)) {
      disabled = component.component.disabled;
    }

    return disabled || !component.isEmpty(value);
  }
};

FormioValidator.validators.maxLength = {
  ...FormioValidator.validators.maxLength,
  message(component, setting) {
    return component.t(component.errorMessage('maxLength'), {
      field: component.errorLabel,
      length: setting,
      data: component.data
    });
  }
};

export default FormioValidator;
