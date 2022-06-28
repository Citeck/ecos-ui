import FormIOUrlComponent from 'formiojs/components/url/Url';
import { overrideTriggerChange } from '../misc';

export default class UrlComponent extends FormIOUrlComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
