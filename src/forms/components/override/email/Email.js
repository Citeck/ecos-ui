import FormIOEmailComponent from 'formiojs/components/email/Email';
import { overrideTriggerChange } from '../misc';
import { DocUrls } from '../../../../constants/documentation';

export default class EmailComponent extends FormIOEmailComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  static get builderInfo() {
    return {
      ...super.builderInfo,
      documentation: `${DocUrls.COMPONENT}email`
    };
  }
}
