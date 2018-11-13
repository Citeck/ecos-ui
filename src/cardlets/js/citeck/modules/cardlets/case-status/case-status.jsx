import React from 'react';
import NodeCardlet from '../node-cardlet';

import 'xstyle!./case-status.css';

export default class CaseStatus extends NodeCardlet {
  static getFetchUrl(ownProps) {
    return '/share/proxy/alfresco/citeck/case/status?nodeRef=' + ownProps.nodeRef;
  }

  render() {
    let props = this.props;
    let data = this.props.data;

    let statusType = data.statusType || 'status';

    let msgStatusHeader = Alfresco.util.message('cardlet.case-status.header.' + statusType);
    let msgWithoutStatus = Alfresco.util.message('cardlet.case-status.status.empty');

    let isLoading = props.isFetching || data.nodePendingUpdate;

    let loadingClass = isLoading !== false ? 'loading' : '';

    let statusName = '';
    if (!isLoading) {
      statusName = data.statusName || msgWithoutStatus;
    }

    return (
      <div id="cardlet-case-status" className="case-status document-details-panel">
        <h2 className="alfresco-twister">
          <div className="status-line-el">{msgStatusHeader}:</div>
          <div className={`panel-body case-status-name ${loadingClass} status-line-el`}>{statusName}</div>
        </h2>
      </div>
    );
  }
}
