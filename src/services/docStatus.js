import { t } from '../helpers/util';
import { head, isEmpty } from 'lodash';

export default class DocStatusService {
  static NO_STATUS = { id: 'no-status', name: t('Нет статуса') };

  static processStatusFromServer = function(source) {
    const status = head(source.records);

    return isEmpty(status) ? DocStatusService.NO_STATUS : status;
  };
}
