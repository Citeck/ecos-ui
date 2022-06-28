import FormIOUrlComponent from 'formiojs/components/url/Url';
import { overrideTriggerChange } from '../misc';
import { DocUrls } from '../../../../constants/documentation';

export default class UrlComponent extends FormIOUrlComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  static get builderInfo() {
    return {
      ...super.builderInfo,
      documentation: `${DocUrls.COMPONENT}url`
    };
  }
}
