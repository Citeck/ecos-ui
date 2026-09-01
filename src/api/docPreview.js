import { SourcesId } from '@citeck/constants';
import { PROXY_URI } from '@citeck/constants/alfresco';
import Records from '@citeck/records-core';
import endsWith from 'lodash/endsWith';
import get from 'lodash/get';

import { getDownloadContentUrl, isEcosContentUrl, setDownloadParam } from '@/helpers/urls';

export class DocPreviewApi {
  /**
   * The one way to ask what a record holds and how to show it.
   *
   * @param {string} recordRef
   * @returns {Promise<PreviewDescriptor>} rejects when the record cannot be read
   */
  static getPreview = async recordRef => {
    const previewPath = await getPreviewInfo(recordRef);

    const resp =
      (await Records.get(recordRef).load(
        {
          info: previewPath,
          fileName: '.disp',
          version: 'version',
          // whether there is a file at all, which a backend that says nothing about a format it
          // cannot preview leaves the ui no other way of knowing
          contentSize: '_content.size?num'
        },
        true
      )) || {};

    return normalizePreviewInfo(resp.info, {
      recordRef,
      hasContent: !!resp.contentSize,
      fileName: resp.fileName,
      // Cause: https://citeck.atlassian.net/browse/ECOSUI-415. Only the document a dashlet is
      // opened on is versioned this way; the rows of `getPreviews` are not.
      version: resp.version || '1.0'
    });
  };

  /**
   * The documents attached to a record, each already normalized. Deliberately one batched query
   * rather than `getPreview` per row: `getPreviewInfo` costs two sequential `Records.get` calls of
   * its own, so a per-row descriptor would turn one round trip into `3N` in the documents dashlet.
   * The normalizer is what is shared here, not the way the data is fetched.
   *
   * @param {string} recordRef
   * @returns {Promise<Array<{ recordId: string, fileName: string, preview: PreviewDescriptor }>>}
   */
  static getPreviews = recordRef => {
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
        documents: 'documents[]{recordId:?id,fileName:?disp,info:previewInfo?json,contentSize:_content.size?num}'
      }
    )
      .then(resp => {
        const documents = get(resp, 'documents') || [];

        return documents.map(({ recordId, fileName, info, contentSize }) => ({
          recordId,
          fileName,
          preview: normalizePreviewInfo(info, { fileName, recordRef: recordId, hasContent: !!contentSize })
        }));
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };

  /**
   * @deprecated ask for the whole {@link PreviewDescriptor} with {@link DocPreviewApi.getPreview}:
   * a link says nothing about what is behind it.
   * @returns {Promise<string>} the link to show, empty when there is nothing to show
   */
  static getPreviewLinkByRecord = recordRef => {
    return DocPreviewApi.getPreview(recordRef)
      .then(preview => preview.url)
      .catch(e => {
        console.error(e);
        return '';
      });
  };
}

/**
 * Everything the ui needs to show a piece of content and to offer the file behind it, with no
 * knowledge of formats left on the caller's side.
 *
 * @typedef {Object} PreviewDescriptor
 * @property {'image'|'pdf'|'text'|'markdown'|'video'|'audio'|'none'} kind what to render `url` with
 * @property {'ready'|'processing'|'failed'|'unsupported'} status why there is nothing to render yet
 * @property {string} url what to render; empty when there is nothing to show
 * @property {string} mimeType mime type of what is behind `url`, not of the original
 * @property {string} ext extension of what is behind `url`, not of the original
 * @property {number} size bytes behind `url`
 * @property {{ link: string, fileName: string }} download the original, always offered
 */

/** Every `kind` this ui knows how to render. Anything else is degraded, see {@link statedKind}. */
const PREVIEW_KINDS = ['image', 'pdf', 'text', 'markdown', 'video', 'audio', 'none'];

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tif', 'tiff'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown'];
// `x-web-markdown` is what a mime database answers for a `.md` file it recognized by its bytes
const MARKDOWN_MIME_TYPES = ['text/markdown', 'text/x-markdown', 'text/x-web-markdown'];
const TEXT_EXTENSIONS = ['txt', 'log', 'har', 'csv', 'xml', 'html', 'json', 'yaml', 'yml'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'avi', 'mkv'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus'];

/**
 * Turns the `previewInfo` attribute into a {@link PreviewDescriptor}. The only place in the ui that
 * knows anything about formats.
 *
 * @param {Object|null} info the raw `previewInfo?json` value
 * @param {Object} [options]
 * @param {string} [options.fileName] the `.disp` of the record, the name to fall back to
 * @param {string} [options.recordRef] the record itself, the download link to fall back to
 * @param {string} [options.version] stamped on the preview url (ECOSUI-415)
 * @param {boolean} [options.hasContent] whether the record holds a file, asked separately because a
 *   backend that cannot preview a format may say nothing about it at all
 * @returns {PreviewDescriptor}
 */
export function normalizePreviewInfo(info, { fileName, recordRef, version, hasContent = false } = {}) {
  const source = info || {};
  const url = replaceUri(formatLink(source, version));
  const mimeType = source.mimeType || source.mimetype || '';
  const ext = source.ext || '';

  return {
    kind: source.kind ? statedKind(source.kind, mimeType) : inferredKind(url, ext, mimeType),
    status: source.status || (url ? 'ready' : 'unsupported'),
    url,
    mimeType,
    ext,
    size: source.size || 0,
    download: {
      link: downloadLink(source, recordRef, hasContent),
      fileName: downloadFileName(source, fileName)
    }
  };
}

/**
 * A `kind` the backend states is taken as it is. A `kind` this ui does not know is read as text
 * when the mime type is textual and as nothing otherwise — that degradation is what lets the
 * backend introduce a new kind without breaking an older ui, so it is part of the contract
 * (rule 4 of the `previewInfo` contract), not defensive coding.
 */
function statedKind(kind, mimeType) {
  if (PREVIEW_KINDS.includes(kind)) {
    return kind;
  }

  return isTextualMimeType(mimeType) ? 'text' : 'none';
}

/** `text/*`, or a subtype spelled out as text: `+json`, `+xml`, `+yaml`. */
function isTextualMimeType(mimeType) {
  const mime = baseMimeType(mimeType);

  return mime.startsWith('text/') || /\+(json|xml|yaml)$/.test(mime);
}

function baseMimeType(mimeType) {
  return (mimeType || '').toLowerCase().split(';')[0].trim();
}

function mainType(mimeType) {
  return baseMimeType(mimeType).split('/')[0];
}

/**
 * What a backend that does not send `kind` holds, guessed from the extension, the mime type and —
 * as the last resort — the url itself. The order matters: markdown is textual and pdf has an
 * `image/*` thumbnail world of its own.
 */
function inferredKind(url, ext, mimeType) {
  const extension = (ext || '').toLowerCase();
  const mime = baseMimeType(mimeType);

  if (extension === 'pdf' || mime === 'application/pdf' || isPDFbyStr(url)) {
    return 'pdf';
  }

  if (MARKDOWN_EXTENSIONS.includes(extension) || MARKDOWN_MIME_TYPES.includes(mime)) {
    return 'markdown';
  }

  if (mainType(mime) === 'video' || VIDEO_EXTENSIONS.includes(extension)) {
    return 'video';
  }

  if (mainType(mime) === 'audio' || AUDIO_EXTENSIONS.includes(extension)) {
    return 'audio';
  }

  if (mainType(mime) === 'image' || IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }

  if (TEXT_EXTENSIONS.includes(extension) || isTextByStr(url)) {
    return 'text';
  }

  // Whatever else came with a url is shown as a picture, which is what this ui has always done
  // with it. Kept on purpose: an old backend answers with a url only for what it can render.
  return url ? 'image' : 'none';
}

/**
 * The {@link PreviewDescriptor} `kind` of a file known only by its name, for a ui that holds a file
 * rather than a record: no url and no mime type, so anything the extension does not name is 'none'.
 *
 * @param {string} name
 * @returns {'image'|'pdf'|'text'|'markdown'|'video'|'audio'|'none'}
 */
export function previewKindByFileName(name) {
  const dotIdx = (name || '').lastIndexOf('.');

  return dotIdx === -1 ? 'none' : inferredKind('', name.substring(dotIdx + 1), '');
}

/**
 * The link that saves the original. Falls back to what is shown, and then to the content endpoint
 * of the record itself — `DownloadAction` falls back to the same url platform-wide — so that a
 * descriptor with nothing to preview still has something to offer.
 */
function downloadLink(info, recordRef, hasContent) {
  const link = withDownloadIntent(replaceUri(info.originalUrl || info.url));

  if (link || !recordRef || !hasContent) {
    return link;
  }

  // A backend that does not describe what it cannot preview leaves nothing to link to, and a record
  // with a file still has a file. `DownloadAction` reaches for the same url platform-wide. Offered
  // only for a record that holds one, so that "nothing attached" keeps saying so rather than
  // handing out a link to nowhere.
  return getDownloadContentUrl(recordRef);
}

/**
 * The name of the file the user saves. It is a property of the original, never of the rendition:
 * the thumbnail of a `docx` is a pdf, but what is downloaded is still the `docx`.
 */
function downloadFileName({ originalName, originalExt }, fileName) {
  const name = originalName || fileName || '';

  return originalExt && !endsWith(name, originalExt) ? `${name}.${originalExt}` : name;
}

/**
 * Reads a pdf out of a url, for a backend that names neither the extension nor the mime type and
 * for a url a dashlet was configured with by hand. Nothing but the legacy branch of
 * {@link normalizePreviewInfo} may ask a link what it holds.
 */
function isPDFbyStr(str) {
  return (str || '').toLowerCase().endsWith('pdf');
}

/** See {@link isPDFbyStr}. */
function isTextByStr(str) {
  const lower = (str || '').toLowerCase();

  if (!lower) {
    return false;
  }

  return TEXT_EXTENSIONS.includes(lower.substring(lower.lastIndexOf('.') + 1));
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

/**
 * Marks a link meant to save the file as such. The `download` attribute of an anchor covers only
 * a plain click on it: opening the same link in a new tab, copying it or following it from
 * anywhere else must ask the endpoint for the attachment disposition on its own.
 */
function withDownloadIntent(link) {
  return isEcosContentUrl(link) ? setDownloadParam(link, true) : link;
}

/**
 * The url to show, stamped with the version when there is one. It carries nothing else: the
 * extension and the file name used to be appended to it as a `#.ext|name` fragment, which was a way
 * of smuggling the type past an api that only returned a string. The descriptor names both, so a
 * link is a link again.
 */
function formatLink(info, version) {
  const { url = '', originalUrl = '' } = info || {};
  const link = url || originalUrl;

  if (!link || !version) {
    return link;
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-415
  return link.includes('?') ? `${link}&version=${version}` : `${link}?version=${version}`;
}
