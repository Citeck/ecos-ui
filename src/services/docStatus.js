import { t } from '../helpers/util';
import { isEmpty } from 'lodash';

export default class DocStatusService {
  static NO_STATUS = { id: 'no-status', name: 'doc-status-widget.no-status' };

  static processStatusFromServer = function(source) {
    return isEmpty(source) ? { ...DocStatusService.NO_STATUS, name: t(DocStatusService.NO_STATUS.name) } : source;
  };
}
