import NestedComponent from 'formiojs/components/nested/NestedComponent';

import Records from '../../../../components/Records';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';

export default class TaskOutcome extends NestedComponent {
  #buttonKeyPrefix = 'outcome_';

  static schema(...extend) {
    return NestedComponent.schema(
      {
        label: 'Task Outcome',
        key: 'title',
        type: 'taskOutcome',
        mask: false,
        inputType: 'taskOutcome',
        hideLabel: true,
        buttonSize: 'md',
        buttons: [],
        customClass: 'formio-task-outcome',
        components: [],
        input: true
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Task Outcome',
      icon: 'fa fa-square',
      group: 'basic',
      weight: 0,
      schema: TaskOutcome.schema()
    };
  }

  get baseButtonConfig() {
    return {
      type: 'button',
      action: 'submit',
      customClass: 'formio-task-outcome__button',
      theme: 'primary'
    };
  }

  build() {
    this.createElement();
    this.component.components = [];

    if (!this.component.hideLabel) {
      this.createLabel(this.element);
    }

    const record = this.root.options.recordId || '@';
    const attr = (this.component.properties || {}).attribute || this.key;

    if (!record || !attr) {
      return;
    }

    console.warn({ record, attr });

    EcosFormUtils.getForm(record, null, 'definition?json').then(formDef => {
      let inputs = EcosFormUtils.getFormInputs(formDef) || [];

      this.inputs = inputs;

      EcosFormUtils.getData(record, inputs).then(console.warn);

      Records.get(record)
        .load(attr)
        .then(str => {
          console.warn({ str, value: this.dataValue });
          str = 'aaa|Согласовать#alf#bbb|Не согласовать#alf#ccc|Отмена';

          this.generateButtons(this.parseButtons(str));
        });
    });

    // EcosFormUtils.getData(record, inputs).then(console.warn)

    // TODO: load real data
    // Records.get(record).load(attr).then(str => {
    //   console.warn({ str, value: this.dataValue });
    //   str = 'aaa|Согласовать#alf#bbb|Не согласовать#alf#ccc|Отмена';
    //
    //   this.generateButtons(this.parseButtons(str));
    // });
  }

  parseButtons(template = '') {
    if (!template) {
      this.component.buttons = [];

      return [];
    }

    this.component.buttons = template.split('#alf#').map(item => {
      const fields = item.split('|');

      return {
        key: fields[0],
        label: fields[1]
      };
    });

    return this.component.buttons;
  }

  generateButtons() {
    const panel = this.ce('div', {
      id: this.id,
      class: 'mb-2 mt-2 formio-task-outcome__panel'
    });

    this.component.buttons.forEach(button => {
      const config = {
        ...this.baseButtonConfig,
        key: `${this.#buttonKeyPrefix}${button.key}`,
        label: button.label,
        size: this.component.buttonSize
      };

      this.addComponent(config, panel);
    });

    this.element.appendChild(panel);

    console.warn(this);

    this.attachLogic();
  }

  beforeSubmit() {
    const keys = Object.keys(this.data).filter(key => key.includes(this.#buttonKeyPrefix));

    keys.forEach(key => {
      if (!this.data[key]) {
        delete this.data[key];
      }
    });
    console.warn('beforeSubmit => ', this.data);
    super.beforeSubmit();
  }

  viewOnlyBuild() {
    this.buildHiddenElement();
  }
}
