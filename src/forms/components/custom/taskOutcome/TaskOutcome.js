import NestedComponent from 'formiojs/components/nested/NestedComponent';

import _ from 'lodash';

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
const PROC_TASK_OUTCOME_ATTR = 'possibleOutcomes[]?json';
const ALF_TASK_OUTCOME_DELIMITER = '#alf#';
const ALF_TASK_ID_DELIMITER = '$';
const DEFAULT_TASK_BUTTON_THEME = 'primary';

export default class TaskOutcome extends NestedComponent {
  #buttonKeyPrefix = 'outcome_';
  taskRef = '';

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

  get defaultSchema() {
    return TaskOutcome.schema();
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
    this.taskRef = this.root.options.recordId || '';

    if (!this.component.hideLabel) {
      this.createLabel(this.element);
    }

    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name + ' (' + this.key + ')'));
    }

    this.loadButtonsData();
  }

  loadButtonsData() {
    let outcomesAttr = (this.component.properties || {}).attribute || this.key;

    if (!this.taskRef || (!outcomesAttr && !this.isProcTask())) {
      this.generateButtons(this.parseButtons());
      this.attachLogic();

      return;
    }

    if (this.isProcTask()) {
      outcomesAttr = PROC_TASK_OUTCOME_ATTR;
    }

    Records.get(this.taskRef)
      .load(outcomesAttr)
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

    let buttonData;

    if (this.isProcTask()) {
      buttonData = template.map(item => {
        return {
          id: item.id,
          name: item.name,
          theme: _.get(item, 'config.theme', DEFAULT_TASK_BUTTON_THEME).toLowerCase()
        };
      });
    } else {
      buttonData = template
        .split(ALF_TASK_OUTCOME_DELIMITER)
        .map(item => {
          const [buttonKey = '', label] = item.split('|');
          if (!buttonKey) {
            return null;
          }

          const [key, theme = ButtonType.POSITIVE] = buttonKey.split('^');

          return {
            id: key,
            name: t(label || key),
            theme: ThemeByType[theme]
          };
        })
        .filter(button => button)
        .sort((first, second) => first.theme.localeCompare(second.theme));
    }

    this.component.buttons = buttonData.map(item => {
      return {
        key: item.id,
        label: item.name,
        theme: item.theme
      };
    });

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

  isProcTask() {
    const refId = this.taskRef.split('@')[1] || this.taskRef;
    return refId.indexOf(ALF_TASK_ID_DELIMITER) === -1;
  }
}
