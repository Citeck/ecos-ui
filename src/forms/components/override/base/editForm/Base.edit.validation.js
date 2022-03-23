import BaseEditValidation from 'formiojs/components/base/editForm/Base.edit.validation';

BaseEditValidation.push({
  type: 'checkbox',
  input: true,
  weight: 1,
  clearOnHide: true,
  key: 'optionalWhenDisabled',
  label: 'Optional when disabled',
  tooltip: 'Allow form saving if the field at once disabled, required and empty'
});

export default BaseEditValidation;
