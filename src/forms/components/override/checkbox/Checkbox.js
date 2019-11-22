import FormIOCheckBoxComponent from 'formiojs/components/checkbox/Checkbox';
import { t } from '../../../../helpers/util';

export default class CheckBoxComponent extends FormIOCheckBoxComponent {
  build() {
    super.build();

    this.createInlineSaveButton();
  }

  setupValueElement(element) {
    let value = this.getValue();
    element.innerHTML = value ? t('boolean.yes') : t('boolean.no');
  }
}
