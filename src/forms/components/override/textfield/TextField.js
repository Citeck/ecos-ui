import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import { overrideTriggerChange } from '../misc';

export default class TextFieldComponent extends FormIOTextFieldComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
