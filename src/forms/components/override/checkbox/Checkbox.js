import FormIOCheckBoxComponent from 'formiojs/components/checkbox/Checkbox';

import Base from '../base/Base';
import { t } from '../../../../helpers/util';

export default class CheckBoxComponent extends FormIOCheckBoxComponent {
  static schema(...extend) {
    return FormIOCheckBoxComponent.schema(
      {
        defaultValue: false,
        hasThreeStates: false,
        currentState: null,
        beforeState: null
      },
      ...extend
    );
  }

  _beforeState;

  get defaultSchema() {
    return CheckBoxComponent.schema();
  }

  getValueByString = data => {
    let value;

    switch (`${data || null}`) {
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

  get defaultValue() {
    if (this.isRadioCheckbox) {
      return '';
    }

    let defaultValue = this.emptyValue;

    if (this.component.hasThreeStates) {
      if (this.component.defaultValue) {
        defaultValue = this.getValueByString(this.component.defaultValue || null);
      }

      if (this.component.customDefaultValue) {
        const customDefaultValue = this.evaluate(this.component.customDefaultValue, {}, 'value');

        defaultValue = this.getValueByString(customDefaultValue || null);
      }

      console.warn({ defaultValue });

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

  build() {
    super.build();

    this.createInlineEditSaveAndCancelButtons();
  }

  setupValueElement(element) {
    let value = this.getValue();
    element.innerHTML = value ? t('boolean.yes') : t('boolean.no');
  }

  // TODO delete when will fixed in new formiojs version
  updateValue(flags, value) {
    console.warn('setValue => ', {
      value,
      checked: this.input.checked,
      before: this._beforeState
    });

    // if (this.component.hasThreeStates) {
    //
    // }

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

    if (this.component.hasThreeStates) {
      switch (this.component.beforeState) {
        case null:
          value = true;
          this.addClass(this.element, 'checkbox-checked');
          this.removeClass(this.element, 'checkbox-cross-checked');
          break;
        case true:
          value = false;
          // this.removeClass(this.element, 'checkbox-checked');
          this.addClass(this.element, 'checkbox-checked checkbox-checked_cross');
          break;
        case false:
        default:
          value = null;
          this.removeClass(this.element, 'checkbox-checked');
          this.removeClass(this.element, 'checkbox-checked_cross');
      }

      this.component.beforeState = value;

      return Base.prototype.updateValue.call(this, flags, value);
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
