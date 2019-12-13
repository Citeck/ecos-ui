import React from 'react';
import { ecosFetch } from '../../helpers/ecosWrappers';

export default class NodeCardlet extends React.Component {
  static getFetchKey(ownProps) {
    return ownProps.nodeInfo.modified;
  }

  static fetchData(ownProps, onSuccess, onFailure) {
    let getFetchUrl = this.prototype.constructor.getFetchUrl;
    if (getFetchUrl) {
      let url = getFetchUrl(ownProps);
      ecosFetch(url)
        .then(response => {
          return response.json();
        })
        .then(data => {
          onSuccess({
            ...data,
            nodePendingUpdate: ownProps.nodeInfo.pendingUpdate
          });
        })
        .catch(onFailure);
    } else {
      onFailure('getFetchUrl is not implemented');
    }
  }
}
