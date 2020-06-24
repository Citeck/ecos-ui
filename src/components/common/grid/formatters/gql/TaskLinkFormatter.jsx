import React from 'react';
import get from 'lodash/get';

import { createTaskUrl, isNewVersionPage } from '../../../../../helpers/urls';
import { REMOTE_TITLE_ATTR_NAME } from '../../../../../constants/pageTabs';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class TaskLinkFormatter extends DefaultGqlFormatter {
  render() {
    const { row = {}, cell } = this.props;
    const taskId = get(row, 'wfm:workflowId', '');

    if (!taskId) {
      return this.value(cell);
    }

    const url = createTaskUrl(taskId);
    let linkProps = {};

    if (isNewVersionPage()) {
      linkProps = {
        target: '_blank',
        rel: 'noopener noreferrer',
        ...{ [REMOTE_TITLE_ATTR_NAME]: true }
      };
    }

    return (
      <a href={url} {...linkProps}>
        {this.value(cell)}
      </a>
    );
  }
}
