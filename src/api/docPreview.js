import endsWith from 'lodash/endsWith';

import Records from '../components/Records';
import { PROXY_URI } from '../constants/alfresco';

export class DocPreviewApi {
  static getPreviewLinkByRecord = recordRef => {
    return Records.get(recordRef)
      .load(
        {
          info: 'previewInfo?json',
          fileName: '.disp',
          version: 'version'
        },
        true
      )
      .then(resp => {
        resp = resp || {};

        const fileName = resp.fileName || '';
        const version = resp.version || '1.0';
        const { url = '', ext = '', originalUrl = '' } = resp.info || {};
        let link = url || originalUrl;

        // Cause: https://citeck.atlassian.net/browse/ECOSUI-415
        if (link.includes('?')) {
          link += `&version=${version}`;
        } else {
          link += `?version=${version}`;
        }

        if (link && ext) {
          const extWithDot = '.' + ext;
          const withFileName = fileName ? `|${fileName}.${ext}` : '';

          return endsWith(link, extWithDot) ? `${link}${withFileName}` : `${link}#.${ext}${withFileName}`;
        }

        return '';
      })
      .then(url => (url || '').replace('alfresco/', PROXY_URI))
      .catch(e => {
        console.error(e);
        return '';
      });
  };

  static getFileName = recordRef => {
    return Records.get(recordRef)
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

  static getDownloadData = recordRef => {
    return Records.get(recordRef)
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
        const link = (originalUrl || '').replace('alfresco/', PROXY_URI);

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

  static getFilesList = recordRef => {
    return Records.query(
      {
        sourceId: 'alfresco/documents',
        language: 'types-documents',
        query: {
          recordRef,
          types: ['emodel/type@user-base']
        }
      },
      {
        documents: 'documents[]{id:?id,displayName:?disp,previewUrl:_content.previewInfo.url}'
      }
    )
      .then(resp => {
        if (resp.records[0]) {
          const { documents } = resp.records[0];

          return documents;
        }

        return [];
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };
}
