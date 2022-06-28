import FormIOPhoneNumberComponent from 'formiojs/components/phonenumber/PhoneNumber';
import { overrideTriggerChange } from '../misc';
import { DocUrls } from '../../../../constants/documentation';

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

  static get builderInfo() {
    return {
      ...super.builderInfo,
      documentation: `${DocUrls.COMPONENT}phone-number`
    };
  }

  get defaultSchema() {
    return PhoneNumberComponent.schema();
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
