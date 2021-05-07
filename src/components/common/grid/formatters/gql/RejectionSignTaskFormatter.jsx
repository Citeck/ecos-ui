import React from 'react';

import DefaultGqlFormatter from './DefaultGqlFormatter';
import { URL } from '../../../../../constants';

export default class RejectionSignTaskFormatter extends DefaultGqlFormatter {
  render() {
    const props = this.props;
    const { cell } = props;

    if (!cell) {
      return '';
    }

    return (
      <this.PopperWrapper text={`activiti$${cell}`}>
        <a
          href={`${URL.DASHBOARD}?recordRef=alfresco/wftask@activiti$${cell}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
        >
          {`activiti$${cell}`}
        </a>
      </this.PopperWrapper>
    );
  }
}
