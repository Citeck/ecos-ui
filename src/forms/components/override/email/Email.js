import FormIOEmailComponent from 'formiojs/components/email/Email';
import { overrideTriggerChange } from '../misc';

export default class EmailComponent extends FormIOEmailComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
