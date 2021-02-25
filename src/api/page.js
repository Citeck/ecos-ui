import Records from '../components/Records';
import { CommonApi } from './common';

export class PageApi extends CommonApi {
  getJournalTitle = journalId => {
    return Records.get('uiserv/rjournal@' + journalId)
      .load('.disp')
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
