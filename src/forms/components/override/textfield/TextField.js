import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
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
        hintData: {
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
    const { hintData } = this.component;

    if (!isEmpty(hintData.custom)) {
      return this.evaluate(
        hintData.custom,
        {
          values: []
        },
        'values'
      );
    }

    if (!isEmpty(hintData.values)) {
      return hintData.values;
    }

    if (!isEmpty(hintData.json)) {
      return JSON.parse(hintData.json);
    }

    return [];
  }

  clearTypeahead() {
    if (this.component.isTypeahead) {
      this.typeaheadElement.classList.add('d-none');
      this.typeaheadElement.innerHTML = null;
    }
  }

  createTypeaheadElement() {
    if (!this.component.isTypeahead || !this.input) {
      return;
    }

    this.typeaheadElement = this.ce('ul', {
      class: 'd-none formio-component-textfield__typeahead'
    });

    if (this.element.lastChild.isSameNode(this.input)) {
      this.element.appendChild(this.typeaheadElement);
    } else {
      this.element.insertBefore(this.typeaheadElement, this.input.nextSibling);
    }

    this.typeaheadElement.addEventListener('click', this.onClickTypeahead, { capture: true });
  }

  createInput(container) {
    this.input = super.createInput(container);

    this.createTypeaheadElement();

    this.addEventListener(this.input, 'blur', this.onInputBlur);
    this.addEventListener(this.input, 'focus', () => {
      this.onInputBlur.cancel();
      this.calculateTypeahead();
    });

    return this.input;
  }

  calculateTypeahead() {
    if (!this.component.isTypeahead) {
      return;
    }

    if (!isEmpty(this.typeahead) && Array.isArray(this.typeahead)) {
      this.typeaheadElement.innerHTML = null;
      this.typeahead.forEach(item => {
        const text = String(item);

        if (text.includes(this.dataValue)) {
          this.typeaheadElement.appendChild(
            this.ce(
              'li',
              {
                class: 'formio-component-textfield__typeahead-item'
              },
              item
            )
          );
        }
      });
      this.typeaheadElement.classList.remove('d-none');
    }

    if (isEmpty(this.dataValue)) {
      this.clearTypeahead();
    }
  }

  onInputBlur = debounce(() => {
    this.clearTypeahead();
  }, 300);

  onClickTypeahead = event => {
    this.setValue(get(event, 'target.innerText'));
    this.input.focus();
  };

  onChange(...data) {
    this.calculateTypeahead();

    super.onChange.call(this, ...data);
  }
}
