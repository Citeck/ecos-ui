import FormIOCheckBoxComponent from 'formiojs/components/checkbox/Checkbox';
import get from 'lodash/get';
import _ from 'lodash';

import Base from '../base/Base';
import { t } from '../../../../helpers/util';

Object.defineProperty(FormIOCheckBoxComponent.prototype, 'dataValue', {
  set: function(value) {
    if (!this.key) {
      return value;
    }

    if (this.component.hasThreeStates) {
      if (value === undefined) {
        _.unset(this.data, this.key);
      } else {
        _.set(this.data, this.key, value);
      }

      return value;
    }

    if (value === null || value === undefined) {
      _.unset(this.data, this.key);
    } else {
      _.set(this.data, this.key, value);
    }

    if (this.isRadioCheckbox) {
      _.set(this.data, this.component.key, value === this.component.value);

      this.setCheckedState(value);
    }

    return value;
  }
});

Object.defineProperty(FormIOCheckBoxComponent.prototype, 'defaultValue', {
  get: function() {
    if (this.isRadioCheckbox) {
      return '';
    }

    let defaultValue = this.emptyValue;

    if (this.component.hasThreeStates) {
      if (this.component.defaultValue !== undefined) {
        defaultValue = this.getValueByString(get(this.component, 'defaultValue', null));
      }

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
});

export default class CheckBoxComponent extends FormIOCheckBoxComponent {
  static schema(...extend) {
    return FormIOCheckBoxComponent.schema(
      {
        defaultValue: false,
        hasThreeStates: false
      },
      ...extend
    );
  }

  #beforeState;

  get defaultSchema() {
    return CheckBoxComponent.schema();
  }

  isEmpty(value) {
    if (this.component.hasThreeStates) {
      return value === null;
    }

    return super.isEmpty(value) || value === false;
  }

  getValueByString = data => {
    let value;

    switch (`${data === undefined ? null : data}`) {
      case 'true':
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
    this.checkState();
  }

  checkState() {
    if (!this.component.hasThreeStates) {
      return;
    }

    let value;

    switch (this.defaultValue) {
      case null:
        value = null;
        this.removeClass(this.element, 'checkbox-checked');
        this.removeClass(this.element, 'checkbox-checked_cross');
        break;
      case true:
        value = true;
        this.removeClass(this.element, 'checkbox-checked_cross');
        this.addClass(this.element, 'checkbox-checked');
        break;
      case false:
      default:
        value = false;
        this.addClass(this.element, 'checkbox-checked checkbox-checked_cross');
    }

    if (this.#beforeState === undefined && this.#beforeState !== this.defaultValue) {
      this.dataValue = this.defaultValue;
    }

    this.#beforeState = value;
    this.input.checked = value;
    this.input.value = value;
    this.labelSpan.setAttribute('title', value);
  }

  setupValueElement(element) {
    let value = this.getValue();
    element.innerHTML = value ? t('boolean.yes') : t('boolean.no');
  }

  // TODO delete when will fixed in new formiojs version
  updateValue(flags, value) {
    if (this.component.hasThreeStates) {
      if (!flags.modified) {
        return;
      }

      let newValue;

      switch (this.#beforeState) {
        case null:
          newValue = true;
          this.addClass(this.element, 'checkbox-checked');
          this.removeClass(this.element, 'checkbox-cross-checked');
          break;
        case true:
          newValue = false;
          this.addClass(this.element, 'checkbox-checked checkbox-checked_cross');
          break;
        case false:
        default:
          newValue = null;
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
