import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { URL_PAGECONTEXT } from '../../../../../constants/alfresco';

export default class RejectionSignTaskFormatter extends DefaultGqlFormatter {
  render() {
    let props = this.props;
    let { cell } = props;

    if (!cell) {
      return '';
    }

    return (
      <a
        href={`${URL_PAGECONTEXT}task-edit?taskId=activiti$${cell}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        {`activiti$${cell}`}
      </a>
    );
  }
}
