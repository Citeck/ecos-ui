import { RecordService } from './recordService';
import Records from '../components/Records';

export class DocPreviewApi extends RecordService {
  static getLinkByRecord = nodeRef => {
    return Records.get(nodeRef)
      .load('previewInfo?json', true)
      .then(resp => {
        resp = resp || {};
        const { url = '', ext = '' } = resp;

        return url && ext ? `${url}.${ext}` : '';
      })
      .then(url => (url ? `/share/proxy/${url}` : ''));
  };
}
