import FormIOPhoneNumberComponent from 'formiojs/components/phonenumber/PhoneNumber';
import { overrideTriggerChange } from '../misc';

export default class PhoneNumberComponent extends FormIOPhoneNumberComponent {
  static schema(...extend) {
    return FormIOPhoneNumberComponent.schema(
      {
        allowMultipleMasks: false,
        showWordCount: false,
        showCharCount: false,
        inputFormat: 'plain'
      },
      ...extend
    );
  }

  get defaultSchema() {
    return PhoneNumberComponent.schema();
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
