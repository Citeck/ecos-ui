import React from 'react';

import { t } from '../../../../../../helpers/util';

import BaseFormatter from '../BaseFormatter';

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

    return (
      <this.PopperWrapper text={priority || this.value(cell)}>
        {priority ? (
          <span className={`workflow-priority-formatter workflow-priority-formatter_${Codes[cell]}`}>{priority}</span>
        ) : (
          <React.Fragment>{this.value(cell)}</React.Fragment>
        )}
      </this.PopperWrapper>
    );
  }
}
