import { RecordService } from './recordService';
import Records from '../components/Records';

import endsWith from 'lodash/endsWith';

export class DocPreviewApi extends RecordService {
  static getPreviewLinkByRecord = nodeRef => {
    return Records.get(nodeRef)
      .load(
        {
          info: 'previewInfo?json',
          fileName: '.disp'
        },
        true
      )
      .then(resp => {
        resp = resp || {};

        const fileName = resp.fileName || '';
        const { url = '', ext = '', originalUrl = '' } = resp.info || {};
        const link = url || originalUrl;

        if (link && ext) {
          const extWithDot = '.' + ext;
          const withFileName = fileName ? `|${fileName}.${ext}` : '';

          return endsWith(link, extWithDot) ? `${link}${withFileName}` : `${link}#.${ext}${withFileName}`;
        }

        return '';
      })
      .then(url => (url ? `/share/proxy/${url}` : ''))
      .catch(e => {
        console.error(e);
        return '';
      });
  };

  static getFileName = nodeRef => {
    return Records.get(nodeRef)
      .load(
        {
          json: 'previewInfo?json',
          fileName: '.disp'
        },
        true
      )
      .then(resp => {
        resp = resp || {};

        const json = resp.json || {};
        const { ext = '' } = json;
        const fileName = resp.fileName || '';

        if (ext) {
          return `${fileName}.${ext}`;
        }

        return fileName;
      })
      .catch(e => {
        console.error(e);
        return '';
      });
  };

  static getDownloadData = nodeRef => {
    return Records.get(nodeRef)
      .load(
        {
          info: 'previewInfo?json',
          fileName: '.disp'
        },
        true
      )
      .then(resp => {
        resp = resp || {};

        const { originalUrl, originalName, originalExt } = resp.info || {};
        const link = originalUrl ? `/share/proxy/${originalUrl}` : '';
        let fileName = originalName || resp.fileName;

        if (!endsWith(fileName, originalExt)) {
          fileName += `.${originalExt}`;
        }

        return { link, fileName };
      })
      .catch(e => {
        console.error(e);
        return {};
      });
  };
}
