import { RecordService } from './recordService';
import Records from '../components/Records';

export class EsignApi extends RecordService {
  getDocumentData = record => {
    return fetch(`/share/proxy/alfresco/acm/digestAndAttr?nodeRef=${record}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };
}
