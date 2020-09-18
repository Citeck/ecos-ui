import ActionsExecutor from '../ActionsExecutor';
import { PROXY_URI } from '../../../../../constants/alfresco';
import { debounce } from '../../../../../helpers/util';

import { CommonApi } from '../../../../../api/common';
import { getZipUrl } from '../../../../../helpers/urls';
import DownloadAction from './DownloadAction';
import recordActions from '../../recordActions';

export default class DownloadZipAction extends ActionsExecutor {
  static ACTION_ID = 'download-zip';

  #commonApi = new CommonApi();

  createZip = selected => {
    return this.#commonApi
      .postJson(`${PROXY_URI}api/internal/downloads`, selected.map(s => ({ nodeRef: s })))
      .then(resp => this.getStatus(resp.nodeRef))
      .catch(() => null);
  };

  getStatus = nodeRef => {
    return this.#commonApi
      .getJson(`${PROXY_URI}api/internal/downloads/${nodeRef.replace(':/', '')}/status`)
      .then(status => {
        if (status.status !== 'DONE') {
          return debounce(this.getStatus, 500)(nodeRef);
        }
        return nodeRef;
      })
      .catch(() => null);
  };

  deleteDownloadsProgress = nodeRef => {
    return this.#commonApi.deleteJson(`${PROXY_URI}api/internal/downloads/${nodeRef.replace(':/', '')}`, true).then(resp => resp);
  };

  async execForRecords(records, action, context) {
    const nodeRef = await this.createZip(records.map(r => r.id));

    if (nodeRef) {
      const result = recordActions.execForRecord(nodeRef, {
        type: DownloadAction.ACTION_ID,
        config: {
          url: getZipUrl(nodeRef),
          fileName: 'Archive.zip'
        }
      });
      await this.deleteDownloadsProgress(nodeRef);
      return result;
    }
    return false;
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-download',
      name: 'group-action.select.download'
    };
  }
}
