import FormIOCheckBoxComponent from 'formiojs/components/checkbox/Checkbox';
import get from 'lodash/get';
import unset from 'lodash/unset';
import set from 'lodash/set';

import Base from '../base/Base';
import { t } from '../../../../helpers/util';

export default class CheckBoxComponent extends FormIOCheckBoxComponent {
  static schema(...extend) {
    return FormIOCheckBoxComponent.schema(
      {
        defaultValue: undefined,
        hasThreeStates: false,
        labelPosition: 'right-left'
      },
      ...extend
    );
  }

  #beforeState;

  set dataValue(value) {
    if (!this.key) {
      return value;
    }

    if (this.hasThreeStates) {
      if (value === undefined) {
        unset(this.data, this.key);
      } else {
        set(this.data, this.key, value);
      }

      this.checkState(value);

      return value;
    }

    if (value === null || value === undefined) {
      unset(this.data, this.key);
    } else {
      set(this.data, this.key, value);
    }

    if (this.isRadioCheckbox) {
      set(this.data, this.component.key, value === this.component.value);

      this.setCheckedState(value);
    }

    return value;
  }

  get defaultValue() {
    if (this.isRadioCheckbox) {
      return '';
    }

    let defaultValue = this.emptyValue;

    if (this.hasThreeStates) {
      defaultValue = this.getValueByString(get(this.component, 'defaultValue', null));

      if (this.component.customDefaultValue) {
        const customDefaultValue = this.evaluate(this.component.customDefaultValue, {}, 'value');

        defaultValue = this.getValueByString(customDefaultValue !== undefined ? customDefaultValue : null);
      }

      return defaultValue;
    }

    if (this.component.defaultValue) {
      defaultValue = (this.component.defaultValue || false).toString() === 'true';
    }

    if (this.component.customDefaultValue) {
      const customDefaultValue = this.evaluate(this.component.customDefaultValue, {}, 'value');

      defaultValue = (customDefaultValue || false).toString() === 'true';
    }

    return defaultValue;
  }

  get dataValue() {
    let Value;

    if (!this.key) {
      Value = this.emptyValue;
    }

    if (!this.hasValue()) {
      this.dataValue = this.component.multiple ? [] : this.emptyValue;
    }

    Value = get(this.data, this.key);

    if (this.isRadioCheckbox) {
      set(this.data, this.component.key, Value === this.component.value);
    }

    return Value;
  }

  get defaultSchema() {
    return CheckBoxComponent.schema();
  }

  get hasThreeStates() {
    return this.component.hasThreeStates;
  }

  isEmpty(value) {
    if (this.hasThreeStates) {
      return value === null;
    }

    return super.isEmpty(value);
  }

  setInputLabelStyle(label) {
    const span = this.labelSpan;

    span.className = `form-check-label__span form-check-label__span_position-${this.component.labelPosition}`;

    return super.setInputLabelStyle(label);
  }

  createElement() {
    const className = ['form-check', this.className];

    if (!this.labelIsHidden()) {
      className.push(this.component.inputType || 'checkbox');
    }

    if (['left-right', 'right-right'].includes(this.component.labelPosition)) {
      className.push('formio-component-checkbox_right');
    }

    // If the element is already created, don't recreate.
    if (this.element) {
      //update class for case when Logic changed container class (customClass)
      this.element.className = className.join(' ');
      return this.element;
    }

    this.element = this.ce('div', {
      id: this.id,
      class: className.join(' ')
    });
    this.element.component = this;
  }

  createLabel(container, input) {
    const isLabelHidden = this.labelIsHidden();
    const className = ['control-label', 'form-check-label'];

    if (this.component.input && !this.options.inputsOnly && this.component.validate && this.component.validate.required) {
      className.push('field-required');
    }

    this.labelElement = this.ce('label', {
      class: className.join(' ')
    });
    this.addShortcut();

    if (!isLabelHidden) {
      // Create the SPAN around the textNode for better style hooks
      this.labelSpan = this.ce('span');

      if (this.info.attr.id) {
        this.labelElement.setAttribute('for', this.info.attr.id);
      }
    }

    this.addInput(input, this.labelElement);

    if (!isLabelHidden) {
      this.setInputLabelStyle(this.labelElement);
      this.setInputStyle(input);
      this.labelSpan.appendChild(this.text(this.addShortcutToLabel()));
      this.labelElement.appendChild(this.labelSpan);
    }

    this.createTooltip(this.labelElement);
    container.appendChild(this.labelElement);
  }

  getValueByString = data => {
    let value;

    switch (`${data === undefined ? null : data}`) {
      case 'true':
      case '1':
      case 'on':
        value = true;
        break;
      case 'false':
        value = false;
        break;
      case 'null':
        value = null;
        break;
      default:
        value = '';
    }

    return value;
  };

  build() {
    super.build();

    this.createInlineEditSaveAndCancelButtons();
    this.checkState(this.defaultValue, true);
  }

  checkState(state, needUpdate) {
    if (!this.hasThreeStates) {
      return;
    }

    let value;

    switch (`${state}`) {
      case 'null':
        value = null;
        this.removeClass(this.element, 'checkbox-checked');
        this.removeClass(this.element, 'checkbox-checked_cross');
        break;
      case 'true':
        value = true;
        this.removeClass(this.element, 'checkbox-checked_cross');
        this.addClass(this.element, 'checkbox-checked');
        break;
      case 'false':
      default:
        value = false;
        this.addClass(this.element, 'checkbox-checked checkbox-checked_cross');
    }

    if (needUpdate && this.#beforeState === undefined && this.#beforeState !== state) {
      this.dataValue = state;
    }

    this.#beforeState = value;

    if (this.input) {
      this.input.checked = value;
      this.input.value = value;
    }

    this.labelSpan && this.labelSpan.setAttribute('title', value);
  }

  setupValueElement(element) {
    if (this.component.unreadable) {
      this.setUnreadableLabel(element);
      return;
    }

    let value = this.getValue();
    element.innerHTML = value ? t('boolean.yes') : t('boolean.no');
  }

  getValueAt(index) {
    if (this.hasThreeStates) {
      return this.dataValue;
    }

    return super.getValueAt(index);
  }

  setCheckedState(value) {
    if (this.hasThreeStates) {
      const newValue = this.getValueByString(value);

      if (this.input) {
        this.input.checked = newValue;
        this.input.value = newValue;
      }

      return newValue;
    }

    return super.setCheckedState(value);
  }

  // TODO delete when will fixed in new formiojs version
  updateValue(flags, value) {
    if (this.hasThreeStates) {
      if (!flags.modified && value === undefined) {
        return;
      }

      let newValue;

      if (value !== undefined) {
        newValue = this.getValueByString(value);
      } else {
        /**
         * value change logic:
         * true => false => null => etc by circle
         */
        switch (this.#beforeState) {
          case null:
            newValue = true;
            break;
          case true:
            newValue = false;
            break;
          case false:
          default:
            newValue = null;
        }
      }

      switch (newValue) {
        case true:
          this.addClass(this.element, 'checkbox-checked');
          this.removeClass(this.element, 'checkbox-cross-checked');
          break;
        case false:
          this.addClass(this.element, 'checkbox-checked checkbox-checked_cross');
          break;
        case null:
        default:
          this.removeClass(this.element, 'checkbox-checked');
          this.removeClass(this.element, 'checkbox-checked_cross');
      }

      const changed = newValue !== undefined ? this.hasChanged(newValue, this.dataValue) : false;

      if (this.viewOnly) {
        this.updateViewOnlyValue(newValue);
      }

      this.#beforeState = newValue;
      this.input.checked = newValue;
      this.input.value = newValue;
      this.dataValue = newValue;
      this.labelSpan.setAttribute('title', newValue);
      this.updateOnChange(flags, changed);

      return changed;
    }

    if (this.isRadioCheckbox) {
      if (value === undefined && this.input.checked) {
        // Force all siblings elements in radio group to unchecked
        this.getRadioGroupItems()
          .filter(c => c !== this && c.input.checked)
          .forEach(c => (c.input.checked = false));

        value = this.component.value;
      } else {
        value = this.getRadioGroupValue();
      }
    } else if (flags && flags.modified && this.input.checked && value === undefined) {
      value = true;
    }

    const changed = Base.prototype.updateValue.call(this, flags, value);

    // it's fix
    if (!this.input) {
      return changed;
    }

    if (this.input.checked) {
      this.input.setAttribute('checked', true);
      this.addClass(this.element, 'checkbox-checked');
    } else {
      this.input.removeAttribute('checked');
      this.removeClass(this.element, 'checkbox-checked');
    }

    return changed;
  }
}
