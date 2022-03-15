import FormIOCheckBoxComponent from 'formiojs/components/checkbox/Checkbox';
import Base from '../base/Base';
import { t } from '../../../../helpers/util';

export default class CheckBoxComponent extends FormIOCheckBoxComponent {
  static schema(...extend) {
    return FormIOCheckBoxComponent.schema(
      {
        defaultValue: false,
        labelPosition: 'left-left'
      },
      ...extend
    );
  }

  get defaultSchema() {
    return CheckBoxComponent.schema();
  }

  get defaultValue() {
    if (this.isRadioCheckbox) {
      return '';
    }

    let defaultValue = this.emptyValue;

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

  createLabel(...params) {
    if (['right', 'left'].some(p => p === this.component.labelPosition)) {
      this.component.labelPosition = this.defaultSchema.labelPosition;
    }

    super.createLabel(...params);

    this.addClass(this.labelElement, 'form-check-label_' + this.component.labelPosition);

    if (this.component.tooltip) {
      this.addClass(this.labelElement, 'form-check-label_has-tip');
    }

    if (this.labelSpan) {
      this.addClass(this.labelSpan, 'form-check-text');
    }

    if (this.labelOnTheTopOrLeft() && this.labelSpan) {
      const child = this.labelElement.removeChild(this.labelSpan);
      this.labelElement.appendChild(child);
    }
  }
}
