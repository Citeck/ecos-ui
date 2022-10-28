import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import { overrideTriggerChange } from '../misc';
import { t } from '../../../../helpers/util';

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
        },
        get addAnother() {
          return t('ecos.forms.btn.add-another');
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

    this.input.setAttribute('autocomplete', 'off');

    this.typeaheadElement = this.ce('ul', {
      class: 'd-none formio-component-textfield__typeahead'
    });

    const wrapper = this.ce(
      'div',
      {
        style: 'position:relative;'
      },
      this.typeaheadElement
    );

    if (this.element.lastChild.isSameNode(this.input)) {
      this.element.appendChild(wrapper);
    } else {
      this.element.insertBefore(wrapper, this.input.nextSibling);
    }

    this.typeaheadElement.addEventListener('click', this.onClickTypeahead, { capture: true });
  }

  createInput(container) {
    this.input = super.createInput(container);

    this.createTypeaheadElement();

    this.addEventListener(this.input, 'blur', this.onInputBlur);
    this.addEventListener(this.input, 'focus', event => {
      this.onInputBlur.cancel();
      this.calculateTypeahead(event.target.value);
    });

    return this.input;
  }

  async calculateTypeahead(value) {
    if (!this.component.isTypeahead || !this.typeaheadElement) {
      return;
    }

    const isEmptyDataValue = isEmpty(value);

    if (isEmptyDataValue) {
      this.clearTypeahead();
    }

    let data = this.typeahead;

    if (isFunction(get(data, 'then'))) {
      data = await data;
    }

    if (isEmpty(data)) {
      this.clearTypeahead();
      return;
    }

    if (Array.isArray(data)) {
      this.typeaheadElement.innerHTML = null;

      data.forEach(item => {
        const text = String(item);

        if (isEmptyDataValue || text.includes(value)) {
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
  }

  onInputBlur = debounce(() => {
    this.clearTypeahead();
  }, 300);

  onClickTypeahead = event => {
    this.setValue(get(event, 'target.innerText'));
    this.input.focus();
  };

  onChange(...data) {
    if (this.root.focusedComponent === this) {
      this.calculateTypeahead(this.dataValue);
    }

    super.onChange.call(this, ...data);
  }
}
