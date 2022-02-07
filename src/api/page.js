import Records from '../components/Records';
import { CommonApi } from './common';
import { SourcesId } from '../constants';

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
