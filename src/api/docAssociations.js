import { RecordService } from './recordService';
import Records from '../components/Records';
import {} from '../constants';

export class DocAssociationsApi extends RecordService {
  getDocuments = recordRef => {
    return Records.get(recordRef)
      .load({
        associatedWith: '.atts(n:"assoc:associatedWith"){id: assoc, displayName: disp, created: att(n:"cm:created"){str}}',
        documents: '.atts(n:"icase:documents"){id: assoc, displayName: disp, created: att(n:"cm:created"){str}}'
      })
      .then(response => response);
  };

  getSectionList = () => {
    return Records.query(
      {
        query: 'TYPE:"st:site"',
        language: 'fts-alfresco'
      },
      ['name', 'title']
    ).then(response => response);
  };

  getJournalList = site => {
    return fetch(`/share/proxy/alfresco/api/journals/list?journalsList=site-${site}-main`).then(response => response);
  };
}
