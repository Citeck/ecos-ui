import { REMOTE_TITLE_ATTR_NAME } from '@citeck/constants/pageTabs';
import Records from '@citeck/records-core';
import React from 'react';

import { createTaskUrl, isNewVersionPage } from '../../../../../helpers/urls';

import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class TaskLinkFormatter extends DefaultGqlFormatter {
  state = {
    workflow: null
  };

  componentDidMount() {
    const { row = {} } = this.props;

    if (!row.id) {
      return;
    }

    Records.get(row.id)
      .load('wfm:workflowId')
      .then(workflow => {
        this.setState({ workflow });
      });
  }

  render() {
    const { cell } = this.props;
    const { workflow } = this.state;

    if (!workflow) {
      return this.value(cell);
    }

    const url = createTaskUrl(workflow);
    let linkProps = {};

    if (isNewVersionPage()) {
      linkProps = {
        target: '_blank',
        rel: 'noopener noreferrer',
        ...{ [REMOTE_TITLE_ATTR_NAME]: true }
      };
    }

    return (
      <this.PopperWrapper text={this.value(cell)}>
        <a href={url} {...linkProps}>
          {this.value(cell)}
        </a>
      </this.PopperWrapper>
    );
  }
}
