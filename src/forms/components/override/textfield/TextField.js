import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { overrideTriggerChange } from '../misc';

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
        },
        isTypeahead: false,
        data: {
          custom: '',
          values: '',
          json: ''
        }
      },
      ...extend
    );
  }

  get defaultSchema() {
    return TextFieldComponent.schema();
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  get typeahead() {
    const { data } = this.component;

    if (!isEmpty(data.custom)) {
      return this.evaluate(
        data.custom,
        {
          values: []
        },
        'values'
      );
    }

    if (!isEmpty(data.values)) {
      return data.values;
    }

    if (!isEmpty(data.json)) {
      return JSON.parse(data.json);
    }

    return [];
  }

  onChange(...data) {
    console.warn(this.typeahead);
    super.onChange.call(this, ...data);
  }
}
