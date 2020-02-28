import { RecordService } from './recordService';
import Records from '../components/Records';
import endsWith from 'lodash/endsWith';

export class DocPreviewApi extends RecordService {
  static getLinkByRecord = nodeRef => {
    return Records.get(nodeRef)
      .load(
        {
          info: 'previewInfo?json',
          fileName: '.disp'
        },
        true
      )
      .then(resp => {
        console.log('resp', resp);
        resp = resp || {};

        const fileName = resp.fileName || '';
        const { url = '', ext = '', originalUrl } = resp.info || {};

        if (url && ext) {
          const extWithDot = '.' + ext;
          const withFileName = fileName ? `|${fileName}.${ext}` : '';

          return endsWith(url, extWithDot) ? url + withFileName : `${url}#.${ext}` + withFileName;
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
