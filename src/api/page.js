import { SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';

import { CommonApi } from './common';

export class PageApi extends CommonApi {
  getJournalTitle = (journalId, force = false) => {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`)
      .load('.disp', force)
      .then(res => res || '')
      .catch(() => '');
  };

  getRecordTitle = recordRef => {
    return Records.get(recordRef)
      .load('.disp', true)
      .then(title => title || '')
      .catch(() => '');
  };
}
