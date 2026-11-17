import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';

import { overrideTriggerChange } from '../misc';

const DISABLED_SAVE_BUTTON_CLASSNAME = 'inline-editing__save-button_disabled';

export const normalizeWhitespaceString = value => (typeof value === 'string' ? value.replace(/[\s\u00A0]+/g, ' ').trim() : value);

export const normalizeComponentWhitespace = value =>
  Array.isArray(value) ? value.map(normalizeWhitespaceString) : normalizeWhitespaceString(value);

function findPropertyDescriptor(proto, prop) {
  let cur = proto;
  while (cur) {
    const desc = Object.getOwnPropertyDescriptor(cur, prop);
    if (desc) {
      return desc;
    }
    cur = Object.getPrototypeOf(cur);
  }
  return undefined;
}

function clearSkippedWhitespaceValidityState(instance) {
  if ((instance.error || (instance.errorElement && instance.errorElement.innerHTML)) && isFunction(instance.setCustomValidity)) {
    instance.setCustomValidity('');
  }
  if (instance._inlineEditSaveButton && !instance.options.saveDraft) {
    instance._inlineEditSaveButton.classList.remove(DISABLED_SAVE_BUTTON_CLASSNAME);
  }
}

/**
 * Attach client-side `component.normalizeWhitespace` hooks strictly to plain text field/area components
 * so non-text components (Number, Select, Checkbox, Email, etc.) and rich-text/code editors are unaffected.
 */
export function applyTextNormalizeWhitespace(ComponentClass) {
  const proto = ComponentClass.prototype;
  const superProto = Object.getPrototypeOf(proto);
  const ownAddFocusBlurEvents = Object.prototype.hasOwnProperty.call(proto, 'addFocusBlurEvents') ? proto.addFocusBlurEvents : null;
  const ownBeforeSubmit = Object.prototype.hasOwnProperty.call(proto, 'beforeSubmit') ? proto.beforeSubmit : null;
  const ownSetValue = Object.prototype.hasOwnProperty.call(proto, 'setValue') ? proto.setValue : null;
  const ownCheckValidity = Object.prototype.hasOwnProperty.call(proto, 'checkValidity') ? proto.checkValidity : null;

  proto.isPlainTextWhitespaceTarget = function () {
    return Boolean(this.component && this.component.normalizeWhitespace && (this.isPlain === undefined || this.isPlain));
  };

  proto.normalizeValueIfNeeded = function (value) {
    if (this.isPlainTextWhitespaceTarget() && (!this.root || this.root.focusedComponent !== this)) {
      return normalizeComponentWhitespace(value);
    }

    return value;
  };

  proto.normalizeWhitespaceOnBlurOrSubmit = function () {
    if (!this.isPlainTextWhitespaceTarget() || this.options.readOnly || this.disabled) {
      return;
    }

    const currentRaw = this.getValue();
    const normalized = normalizeComponentWhitespace(currentRaw);

    if (!isEqual(normalized, currentRaw) || !isEqual(normalized, this.dataValue)) {
      if (this.root && this.root.focusedComponent === this) {
        this.root.focusedComponent = null;
      }

      this.setValue(normalized, { modified: true });
    }
  };

  Object.defineProperty(proto, 'validationValue', {
    configurable: true,
    get: function () {
      const baseDesc = findPropertyDescriptor(superProto, 'validationValue');
      const raw = baseDesc && baseDesc.get ? baseDesc.get.call(this) : this.dataValue;

      if (this.isPlainTextWhitespaceTarget()) {
        return normalizeComponentWhitespace(raw);
      }

      return raw;
    }
  });

  proto.addFocusBlurEvents = function (element) {
    const baseFn = ownAddFocusBlurEvents || superProto.addFocusBlurEvents;
    baseFn.call(this, element);
    this.addEventListener(element, 'blur', () => {
      this.normalizeWhitespaceOnBlurOrSubmit();
    });
  };

  proto.beforeSubmit = function () {
    this.normalizeWhitespaceOnBlurOrSubmit();
    const baseFn = ownBeforeSubmit || superProto.beforeSubmit;
    return baseFn.call(this);
  };

  proto.setValue = function (value, flags) {
    if (!this.viewOnly && !this.options.readOnly) {
      value = this.normalizeValueIfNeeded(value);
    }

    const baseFn = ownSetValue || superProto.setValue;
    return baseFn.call(this, value, flags);
  };

  proto.checkValidity = function (data, dirty, rowData) {
    if (!this.component.unreadable && this.isPlainTextWhitespaceTarget()) {
      const valToCheck = this.validationValue;

      if (!get(this.component, 'validate.required') && !isBoolean(valToCheck) && isEmpty(valToCheck)) {
        clearSkippedWhitespaceValidityState(this);
        return true;
      }

      if (
        this.component.optionalWhenDisabled &&
        get(this.component, 'validate.required') &&
        isEmpty(valToCheck) &&
        this.component.disabled
      ) {
        clearSkippedWhitespaceValidityState(this);
        return true;
      }
    }

    const baseFn = ownCheckValidity || superProto.checkValidity;
    return baseFn.call(this, data, dirty, rowData);
  };
}

export default class TextFieldComponent extends FormIOTextFieldComponent {
  static schema(...extend) {
    return FormIOTextFieldComponent.schema(
      {
        allowMultipleMasks: false,
        showWordCount: false,
        showCharCount: false,
        inputFormat: 'plain',
        normalizeWhitespace: false,
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

  // The value is stored user input: Base writes it as text, this override only adds the tooltip.
  // Cause: COREDEV-546 - writing it with innerHTML ran markup like `<img onerror>` on the record card
  setupValueElement(element) {
    super.setupValueElement(element);

    if (element && !this.component.unreadable) {
      element.setAttribute('title', element.textContent);
    }
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

  isElementOrParentsHidden() {
    let current = this;

    while (!!current) {
      if (get(current, 'element.hidden') === true) {
        return true;
      }
      current = get(current, 'parent', null);
    }

    return false;
  }

  attachRefreshEvent(refreshData) {
    this.on(
      'change',
      () => {
        if (this.component.allowCalculateOverride && this.calculatedValue !== this.dataValue) {
          return;
        }

        if (!this.hasOwnProperty('refreshOnValue')) {
          return;
        }

        this.refresh(refreshData === 'data' ? this.data : this.data[refreshData], refreshData);
      },
      true
    );

    this.on(
      'componentChange',
      event => {
        if (refreshData !== 'data' && event && event.component && event.component.key === refreshData && this.inContext(event.instance)) {
          this.refresh(event.value, refreshData); // Cause https://citeck.atlassian.net/browse/ECOSCOM-2465
        }
      },
      true
    );
  }

  refresh(value, refreshOnKey) {
    // Cause https://citeck.atlassian.net/browse/ECOSCOM-2465
    if (this.hasOwnProperty('refreshOnValue')) {
      this.refreshOnChanged = !isEqual(value, this.refreshOnValue[refreshOnKey]);
      this.refreshOnValue[refreshOnKey] = value;
    } else {
      this.refreshOnChanged = true;
      this.refreshOnValue = {
        [refreshOnKey]: value
      };
    }

    if (this.refreshOnChanged && !this.isElementOrParentsHidden()) {
      if (this.component.clearOnRefresh) {
        this.setValue(null);
      }

      this.triggerRedraw();
    }
  }
}

applyTextNormalizeWhitespace(TextFieldComponent);
