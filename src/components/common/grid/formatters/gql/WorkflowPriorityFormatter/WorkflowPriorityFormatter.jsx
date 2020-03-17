import React, { Fragment } from 'react';
import DefaultGqlFormatter from '../DefaultGqlFormatter';
import { t } from '../../../../../../helpers/util';

import './WorkflowPriorityFormatter.scss';

const Codes = {
  1: 'high',
  2: 'medium',
  3: 'low'
};

export default class WorkflowPriorityFormatter extends DefaultGqlFormatter {
  static getDisplayText(value) {
    const priority = Codes[value];

    return priority ? t(`priority.${priority}`) : '';
  }

  render() {
    const { cell } = this.props;
    const priority = WorkflowPriorityFormatter.getDisplayText(cell);

    return priority ? (
      <span className={`workflow-priority-formatter workflow-priority-formatter_${Codes[cell]}`}>{priority}</span>
    ) : (
      <Fragment>{this.value(cell)}</Fragment>
    );
  }
}
