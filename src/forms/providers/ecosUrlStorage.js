import queryString from 'query-string';

import { uploadContent } from '@/helpers/chunkedUpload';
import { getChunkedUploadErrorMessage } from '@/helpers/chunkedUpload/messages';
import { getDownloadContentUrl } from '@/helpers/urls';

/**
 * formio storage provider that replaces the stock `url` provider. Forked from
 * `node_modules/formiojs/providers/storage/url.js` — same `uploadFile`/`downloadFile` contract and
 * same stored field-value shape — but the actual transport is `src/helpers/chunkedUpload`
 * (`uploadContent`), which decides by itself whether to chunk: small files go through one POST,
 * large ones are chunked automatically. Registered in `src/forms/Formio.js` under the `url` key,
 * so existing forms/stored values need no reconfiguration.
 *
 * Field-value shape produced by `uploadFile` — verified against both the stock provider's own
 * computation and `src/forms/components/override/file/File.js` (`extractFileRecordRef`,
 * `getFileUrl`, `createFileLink`'s `FILE_CLICK_ACTION_DOWNLOAD` branch — the only readers of a
 * `url`-storage file value in this app):
 *   `{storage: 'url', name, url, size, type, data: {entityRef}}`
 * `data.entityRef` is what `File.js`'s `extractFileRecordRef`/download-link building actually key
 * off — `uploadContent` always resolves with (or wraps) an `entityRef` (see its own doc header),
 * so it is always present here, never falls back to the legacy query-string-on-`url` path.
 *
 * That holds for the new backend. There is a second one: a form whose file field targets the
 * legacy Alfresco endpoint gets a different body back and needs a different value — see
 * `legacyAlfrescoValue`. Which of the two a field talks to is decided per component by its `url`,
 * so both shapes have to be produced from the same provider.
 *
 * `url` itself: the backend (`EcosContentController.postMultipartContent`/`postStreamContent`,
 * ecos-webapp-commons) returns a bare `{"entityRef": "..."}` body and never a `url` field, so the
 * stock provider falls back to `` `${xhr.responseURL}/${name}` ``. `File.js`'s
 * `FILE_CLICK_ACTION_DOWNLOAD` link and formio's own `downloadjs`/`window.open` read `file.url`, so
 * this provider stores the content's real download URL — absolute, see `absoluteContentUrl`.
 * `getFileUrl`'s pre-submit delete handler (`File.js`'s
 * `fileService.makeRequest('', url, 'delete')`) also reads it, but `EcosContentController` has no
 * DELETE mapping on this endpoint — only on `/upload-session/{id}` — so that handler is a no-op
 * whatever is stored here.
 */

/**
 * Deliberately no `ecosType`.
 *
 * `File.js#getFileUrl` builds `component.url` as `<endpoint>?containerTypeId=<type>`, which looks
 * like an `ecosType` to pass to `uploadContent`. It is not: `containerTypeId` is an inert query
 * parameter the server never reads (it appears nowhere in ecos-model or ecos-webapp-commons), so
 * every formio attachment goes through `uploadImpl`'s `meta.ecosType.isEmpty()` branch →
 * `ecosContentService.uploadTempFile()`. Passing it would turn it into a real FormData part →
 * `uploadFile().withEcosType(type)` → a record of the container type created at upload time, for
 * every formio attachment, small files included.
 *
 * Note the asymmetry that makes this easy to get wrong: on the chunked path `ecosType` only
 * selects the target STORAGE (the session itself always lives in the `temp-file` DAO), while on
 * the single-shot path it selects the RECORD KIND.
 */

/**
 * The formio form builder exposes a real "Url" text field for storage type `url`
 * (`editForm/File.edit.file.js` — "Enter the url to post the files to"): `component.url` is
 * either that form-configured value or, when unset, the default `File.js#getFileUrl` generates.
 * Under the stock provider that value was the literal POST target, so it must keep being honoured
 * here too — derive `uploadContent`'s `urlBase` from the same `url` argument, stripped of its
 * query string (`uploadContent`'s own endpoints, e.g. `${urlBase}/upload-session`, assume a bare
 * path), falling back to the module's own default (`DEFAULT_URL_BASE`) when `url` is empty. Also
 * strips a single trailing slash: an admin-configured upload URL ending in e.g. `.../content/`
 * would otherwise combine with `uploadContent`'s own appended sub-paths into a double slash
 * (`.../content//upload-session`).
 * @param {string} url
 * @returns {string|undefined}
 */
function extractUrlBase(url) {
  if (!url) {
    return undefined;
  }
  const { url: path } = queryString.parseUrl(url);
  if (!path) {
    return undefined;
  }
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
  return normalized || undefined;
}

/**
 * The download URL of the just-uploaded content, absolute against the page origin.
 *
 * COREDEV-470: for a file field bound to an association, ecos-data reads a *relative*
 * `/gateway/…?ref=…` url (`RecMutAssocHandler.preProcessContentAssocBeforeMutate` →
 * `DbRecContentHandler.getRefFromContentUrl`) as a reference to an already existing record and puts
 * it into the association as is, instead of creating a child record of `fileType` from the content.
 * The ref of a just-uploaded file is a temp file — the wrong record to attach, and one an ordinary
 * user may not modify. The stock provider avoided this because `xhr.responseURL` is absolute; this
 * restores that property while leaving `file.url` a working download href.
 * @param {string} url
 * @returns {string}
 */
function absoluteContentUrl(url) {
  if (!url || !url.startsWith('/')) {
    return url;
  }

  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';

  return origin ? `${origin}${url}` : url;
}

/**
 * How the legacy Alfresco backend addresses an uploaded file, mirroring
 * `FileRepresentation.URL_PATTERN` (ecos-community-core) — the very url Alfresco itself puts on
 * every file value it returns when a form is loaded, so a freshly uploaded file and a stored one
 * are shaped alike.
 */
const ALFRESCO_NODE_URL_PATTERN = '/share/page/card-details?nodeRef=';

/**
 * The value shape the legacy Alfresco backend produces and consumes, for a file field whose `url`
 * points at the Alfresco eform endpoint (`/share/proxy/alfresco/eform/file`).
 *
 * Alfresco is not the new content API and knows nothing about it: `FileEformPost` stores the upload
 * as an `ef:tempFile` node and answers `{"nodeRef": "workspace://SpacesStore/…"}` — never an
 * `entityRef`. Reading only `entityRef`, as the new-backend branch does, therefore throws the one
 * reference the upload produced away, and everything downstream fails silently rather than loudly:
 *
 * - `AlfNodeContentFileHelper.isFileFromEformFormat` requires `data.nodeRef`, so without it a value
 *   is not recognised as a file at all. For a content property (`processPropFileContent`) neither
 *   branch matches and nothing is written — the record is created with empty content, no error.
 * - For a child association the value falls through to the association branch of
 *   `AlfNodesRecordsDAO.mutate`, where every element fails `NodeRef::isNodeRef`, the target set
 *   comes out empty and `NodeUtils.setAssocs(..., primaryChildren = true)` removes **every**
 *   existing child of that association. `parseAttachments` returns an empty list on the same
 *   condition, to the same effect.
 *
 * This is what the stock provider did by construction: it resolved with the parsed response body as
 * `data`, so an Alfresco upload carried `data.nodeRef` without the provider knowing what Alfresco
 * was. The whole body is passed through here for the same reason.
 *
 * Chunking never enters into it: `getUploadConfig` asks `<urlBase>/upload-config`, which Alfresco
 * does not serve, and the `FALLBACK_CONFIG` that failure degrades to has `chunkingThreshold:
 * Infinity` — every file to this endpoint takes `uploadSingleShot`, whose FormData fields (`file`,
 * `name`) are the ones `FileEformPost` reads. So the transport already worked; only the answer was
 * being read with the wrong key.
 * @param {File} file
 * @param {string} name
 * @param {Object} response the raw response body, carrying `nodeRef`
 * @returns {Object} formio file value
 */
function legacyAlfrescoValue(file, name, response) {
  return {
    storage: 'url',
    name,
    url: absoluteContentUrl(`${ALFRESCO_NODE_URL_PATTERN}${response.nodeRef}`),
    size: file.size,
    type: file.type,
    data: { ...response }
  };
}

/**
 * formio calls `progressCallback(evt)` with an XHR-ProgressEvent-shaped `{loaded, total}` (see
 * the stock provider's `xhr.upload.onprogress = onprogress`) and formio's own File component does
 * `parseInt(100 * evt.loaded / evt.total)` to get a percent. Feeding `loaded: percent, total: 100`
 * keeps that formula correct without formio needing to know `uploadContent`'s status vocabulary.
 * @param {Function} progressCallback
 * @returns {Function} a `handleProgress(state, controlFacade)` per the chunkedUpload contract
 */
function adaptProgress(progressCallback) {
  if (typeof progressCallback !== 'function') {
    return () => {};
  }
  return state => {
    const percent = typeof (state && state.percent) === 'number' ? state.percent : 0;
    progressCallback({ loaded: percent, total: 100 });
  };
}

/**
 * `uploadContent` always rejects with an `UploadError` (a real `Error` subclass) whose `.message`
 * is already human-readable — see that module's "Rejection contract" doc. Reject with that string
 * (not the raw `UploadError` instance) so it reaches formio's own error display exactly like the
 * stock provider's rejection did (formio's File component does
 * `.catch(response => { fileUpload.message = response; ... })` and renders `fileUpload.message`
 * as-is — the stock provider always rejects with a string, never an Error object).
 *
 * When the rejection carries a structured `reason` (storage-not-supported / max-size-exceeded /
 * too-many-sessions), the localised, limit-substituted text from `getChunkedUploadErrorMessage`
 * takes precedence over `.message`, which is English-only and unlocalised — a user must never
 * see e.g. "Upload rejected: max-size-exceeded".
 * @param {*} err
 * @returns {string}
 */
function extractUploadErrorMessage(err) {
  return getChunkedUploadErrorMessage(err) || (err && typeof err.message === 'string' && err.message) || 'Upload failed';
}

const ecosUrlStorage = function ecosUrlStorage() {
  return {
    title: 'Url',
    name: 'url',
    uploadFile(file, name, dir, progressCallback, url) {
      const urlBase = extractUrlBase(url);

      return uploadContent(file, {
        name,
        urlBase,
        handleProgress: adaptProgress(progressCallback)
      }).then(
        response => {
          // Alfresco answers with a nodeRef and no entityRef; the new backend the other way round.
          // Checked first because only this branch can tell the two apart at all — see
          // `legacyAlfrescoValue` for what reading `entityRef` off an Alfresco body destroys.
          if (response && response.nodeRef) {
            return legacyAlfrescoValue(file, name, response);
          }

          const entityRef = response && response.entityRef;

          return {
            storage: 'url',
            name,
            // `entityRef` is falsy here only if `uploadContent` ever violated its own documented
            // contract (it always resolves with an entityRef) — defensive, not reachable in
            // practice; kept so a future contract regression degrades instead of throwing.
            url: entityRef ? absoluteContentUrl(getDownloadContentUrl(entityRef)) : url,
            size: file.size,
            type: file.type,
            data: { entityRef }
          };
        },
        err => Promise.reject(extractUploadErrorMessage(err))
      );
    },
    downloadFile(file) {
      // ecos never sets `file.private` (formio's hosted-project private-download flow isn't used
      // here — File.js builds its own document/download URLs) — always resolve unchanged, exactly
      // like the stock provider's non-private branch.
      return Promise.resolve(file);
    }
  };
};

ecosUrlStorage.title = 'Url';

export default ecosUrlStorage;
