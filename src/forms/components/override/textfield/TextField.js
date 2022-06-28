import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import { overrideTriggerChange } from '../misc';
import { DocUrls } from '../../../../constants/documentation';

export default class TextFieldComponent extends FormIOTextFieldComponent {
  static schema(...extend) {
    return FormIOTextFieldComponent.schema(
      {
        allowMultipleMasks: false,
        showWordCount: false,
        showCharCount: false,
        inputFormat: 'plain',
        widget: {
          type: '',
          format: 'yyyy-MM-dd hh:mm a',
          dateFormat: 'yyyy-MM-dd hh:mm a',
          saveAs: 'text'
        },
        validate: {
          customMessage: '',
          json: '',
          required: false,
          custom: '',
          customPrivate: false,
          minLength: '',
          maxLength: '',
          minWords: '',
          maxWords: '',
          pattern: ''
        }
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      ...super.builderInfo,
      documentation: `${DocUrls.COMPONENT}text-field`
    };
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  get defaultSchema() {
    return TextFieldComponent.schema();
  }
}
