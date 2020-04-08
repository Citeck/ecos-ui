import FormIOPhoneNumberComponent from 'formiojs/components/phonenumber/PhoneNumber';
import { overrideTriggerChange } from '../misc';

export default class PhoneNumberComponent extends FormIOPhoneNumberComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
