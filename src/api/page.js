import get from 'lodash/get';

import { isNodeRef } from '../helpers/util';
import { PROXY_URI } from '../constants/alfresco';
import Records from '../components/Records';
import { CommonApi } from './common';

export class PageApi extends CommonApi {
  getJournalTitle = journalId => {
    if (isNodeRef(journalId)) {
      return Records.get(journalId)
        .load('.disp')
        .then(title => title)
        .catch(() => '');
    }

    return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`)
      .then(response => get(response, 'meta.title', ''))
      .catch(() => '');
  };

  getRecordTitle = recordRef => {
    return Records.get(recordRef)
      .load({ displayName: '.disp' }, true)
      .then(response => get(response, 'displayName', ''))
      .catch(() => '');
  };
}
