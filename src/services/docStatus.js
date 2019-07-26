import { t } from '../helpers/util';
import { isEmpty } from 'lodash';

export default class DocStatusService {
  static NO_STATUS = { id: 'no-status', name: t('doc-status-widget.no-status') };

  static processStatusFromServer = function(source) {
    return isEmpty(source) ? DocStatusService.NO_STATUS : source;
  };
}
