import NestedComponent from 'formiojs/components/nested/NestedComponent';

import Records from '../../../../components/Records';
import { t } from '../../../../helpers/util';

const ButtonType = {
  NEGATIVE: 'n',
  POSITIVE: 'p'
};
const ThemeByType = {
  [ButtonType.NEGATIVE]: 'default',
  [ButtonType.POSITIVE]: 'primary'
};

export default class TaskOutcome extends NestedComponent {
  #buttonKeyPrefix = 'outcome_';

  static schema(...extend) {
    return NestedComponent.schema(
      {
        label: 'Task Outcome',
        key: 'taskOutcome',
        type: 'taskOutcome',
        mask: false,
        inputType: 'taskOutcome',
        hideLabel: true,
        buttonSize: 'md',
        buttons: [],
        customClass: 'formio-task-outcome',
        components: [],
        input: true,
        message: 'Action buttons not defined'
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

    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name + ' (' + this.key + ')'));
    }

    this.getButtonsData();
  }

  getButtonsData() {
    const record = this.root.options.recordId || '';
    const attr = (this.component.properties || {}).attribute || this.key;

    if (!record || !attr) {
      this.generateButtons(this.parseButtons());
      this.attachLogic();

      return;
    }

    Records.get(record)
      .load(attr)
      .then((result = '') => {
        this.dataValue = result;

        this.generateButtons(this.parseButtons());
        this.attachLogic();
      });
  }

  parseButtons(template = this.dataValue) {
    if (!template) {
      this.component.buttons = [];

      return [];
    }

    this.component.buttons = template
      .split('#alf#')
      .map(item => {
        const [buttonKey = '', label] = item.split('|');

        if (!buttonKey) {
          return null;
        }

        const [key, theme = ButtonType.POSITIVE] = buttonKey.split('^');

        return {
          key,
          theme: ThemeByType[theme],
          label: t(label || key)
        };
      })
      .filter(button => button)
      .sort((first, second) => first.theme.localeCompare(second.theme));

    return this.component.buttons;
  }

  generateButtons() {
    if (!this.dataValue) {
      this.element.appendChild(
        this.ce(
          'div',
          {
            id: this.id,
            class: 'mb-2 mt-2 formio-task-outcome__panel'
          },
          this.component.message
        )
      );

      return;
    }

    const panel = this.ce('div', {
      id: this.id,
      class: 'mb-2 mt-2 formio-task-outcome__panel'
    });

    this.component.buttons.forEach(button => {
      const config = {
        ...this.baseButtonConfig,
        ...button,
        key: `${this.#buttonKeyPrefix}${button.key}`,
        size: this.component.buttonSize
      };

      this.addComponent(config, panel);
    });

    this.element.appendChild(panel);
  }

  beforeSubmit() {
    const keys = Object.keys(this.data).filter(key => key.includes(this.#buttonKeyPrefix));

    keys.forEach(key => {
      if (!this.data[key]) {
        this.data[key] = undefined;
      }
    });

    super.beforeSubmit();
  }

  viewOnlyBuild() {
    this.buildHiddenElement();
  }
}
