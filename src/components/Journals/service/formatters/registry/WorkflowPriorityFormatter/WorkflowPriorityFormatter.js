import React from 'react';

import { t } from '../../../../../../helpers/util';

import BaseFormatter from '../../BaseFormatter';

import './WorkflowPriorityFormatter.scss';

const Codes = {
  1: 'high',
  2: 'medium',
  3: 'low'
};

export default class WorkflowPriorityFormatter extends BaseFormatter {
  static TYPE = 'workflowPriority';

  static getDisplayText(value) {
    const priority = Codes[value];

    return priority ? t(`priority.${priority}`) : '';
  }

  format(props) {
    const { cell } = props;
    const priority = WorkflowPriorityFormatter.getDisplayText(cell);

    console.log('priority 2:', priority);
    return priority ? (
      <div className="workflow-priority-formatter">
        <span className={`workflow-priority-formatter__pointer workflow-priority-formatter_${Codes[cell]}`} />
        <span className="workflow-priority-formatter__priority">{priority}</span>
      </div>
    ) : (
      <React.Fragment>{this.value(cell)}</React.Fragment>
    );
  }
}
