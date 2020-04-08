import FormIOCheckBoxComponent from 'formiojs/components/checkbox/Checkbox';
import { t } from '../../../../helpers/util';

export default class CheckBoxComponent extends FormIOCheckBoxComponent {
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
}
