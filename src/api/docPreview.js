import { RecordService } from './recordService';
import Records from '../components/Records';
import endsWith from 'lodash/endsWith';

export class DocPreviewApi extends RecordService {
  static getLinkByRecord = nodeRef => {
    return Records.get(nodeRef)
      .load('previewInfo?json', true)
      .then(resp => {
        resp = resp || {};
        const { url = '', ext = '' } = resp;
        if (url && ext) {
          const extWithDot = '.' + ext;
          return endsWith(url, extWithDot) ? url : `${url}#.${ext}`;
        }
        return '';
      })
      .then(url => (url ? `/share/proxy/${url}` : ''))
      .catch(e => {
        console.error(e);
        return '';
      });
  };
}
