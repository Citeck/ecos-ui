import get from 'lodash/get';
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
    const enabledNewJournal = get(window, 'Citeck.constants.NEW_JOURNAL_ENABLED', false);

    const ContentPriority = enabledNewJournal ? (
      <div className="workflow-priority-formatter">
        <span className={`workflow-priority-formatter__pointer workflow-priority-formatter_${Codes[cell]}`} />
        <span className="workflow-priority-formatter__priority">{priority}</span>
      </div>
    ) : (
      <span className={`workflow-priority-formatter workflow-priority-formatter_${Codes[cell]}`}>{priority}</span>
    );

    return priority ? ContentPriority : <React.Fragment>{this.value(cell)}</React.Fragment>;
  }
}
