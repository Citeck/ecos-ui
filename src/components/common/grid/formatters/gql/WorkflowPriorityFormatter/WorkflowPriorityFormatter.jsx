import React, { Fragment } from 'react';
import DefaultGqlFormatter from '../DefaultGqlFormatter';
import { t } from '../../../../../../helpers/util';

import './WorkflowPriorityFormatter.scss';

export default class WorkflowPriorityFormatter extends DefaultGqlFormatter {
  render() {
    let props = this.props;
    let cell = props.cell;

    const codes = {
        '1': 'high',
        '2': 'medium',
        '3': 'low'
      },
      priority = codes[cell];

    return { priority } ? (
      <span className={`workflow-priority-formatter workflow-priority-formatter_${priority}`}>{t('priority.' + priority)}</span>
    ) : (
      <Fragment>{this.value(cell)}</Fragment>
    );
  }
}
