import endsWith from 'lodash/endsWith';
import get from 'lodash/get';

import Records from '../components/Records';
import { PROXY_URI } from '../constants/alfresco';
import { SourcesId } from '../constants';

export class DocPreviewApi {
  static getPreviewLinkByRecord = async recordRef => {
    const previewPath = await getPreviewInfo(recordRef);

    return Records.get(recordRef)
      .load(
        {
          info: previewPath,
          fileName: '.disp',
          version: 'version'
        },
        true
      )
      .then(resp => {
        resp = resp || {};

        const fileName = resp.fileName || '';
        const version = resp.version || '1.0';
        return formatLink(resp.info, fileName, version);
      })
      .then(replaceUri)
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

  static getDownloadData = async recordRef => {
    const previewPath = await getPreviewInfo(recordRef);

    return Records.get(recordRef)
      .load(
        {
          info: previewPath,
          fileName: '.disp'
        },
        true
      )
      .then(resp => {
        resp = resp || {};

        const { originalUrl, originalName, originalExt } = resp.info || {};
        const link = replaceUri(originalUrl);

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

  /**
   * @param recordRef
   * @returns {Promise<Array<Object>>}
   */
  static getFilesList = recordRef => {
    return Records.queryOne(
      {
        sourceId: SourcesId.DOCUMENTS,
        language: 'types-documents',
        query: {
          recordRef,
          types: ['emodel/type@user-base']
        }
      },
      {
        documents: 'documents[]{recordId:?id,fileName:?disp,info:previewInfo?json}'
      }
    )
      .then(resp => {
        const documents = get(resp, 'documents') || [];

        return documents.map(({ recordId, fileName, info }) => {
          let link = formatLink(info, fileName);
          link = replaceUri(link);

          return { recordId, fileName, link };
        });
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };
}

async function getPreviewInfo(recordRef) {
  const typeRef = await Records.get(recordRef).load('_type?id');

  let previewPath = (await Records.get(typeRef).load('contentConfig.previewPath')) || '';

  if (previewPath) {
    previewPath += '.';
  }

  previewPath += 'previewInfo?json';

  return previewPath;
}

function replaceUri(url) {
  return (url || '').replace('alfresco/', PROXY_URI);
}

function formatLink(info, fileName, version) {
  const { url = '', ext = '', originalUrl = '' } = info || {};
  let link = url || originalUrl;

  if (!link) {
    return '';
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-415
  if (version) {
    if (link.includes('?')) {
      link += `&version=${version}`;
    } else {
      link += `?version=${version}`;
    }
  }

  if (ext) {
    const EXT = `.${ext}`;
    let name = '';

    if (fileName) {
      name = `|${fileName}`;
      name += endsWith(fileName, EXT) ? '' : EXT;
    }

    return endsWith(link, EXT) ? `${link}${name}` : `${link}#${EXT}${name}`;
  }

  return link;
}
