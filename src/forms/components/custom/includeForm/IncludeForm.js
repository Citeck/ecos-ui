import { t } from '../../../../helpers/util';
import Records from '../../../../components/Records';
import BaseComponent from '../base/BaseComponent';

export default class IncludeFormComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        customClass: 'formio-component-hidden',
        type: 'includeForm',
        key: 'includeForm',
        inputType: 'hidden'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: t('form-constructor.include-form'),
      icon: 'fa fa-id-card',
      group: 'data',
      weight: 0,
      schema: IncludeFormComponent.schema()
    };
  }

  get defaultSchema() {
    return IncludeFormComponent.schema();
  }

  build() {
    this.createElement();

    if (this.component.formRef && this.root.builderReady !== undefined) {
      super.build();
    }
  }

  createLabel(container) {
    const resolve = name => {
      this.component.label = t('ecos.forms.include-form.label.form', { name });
      super.createLabel(container);
    };

    if (this.component.formRef) {
      Records.get(this.component.formRef)
        .load('.disp')
        .then(resolve);
    } else {
      resolve('-');
    }
  }
}
