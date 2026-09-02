import { SourcesId } from '@citeck/constants';
import { NODE_TYPES } from '@citeck/constants/docLib';
import get from 'lodash/get';

import { WORKER_STATUSES, ACTION_CANCEL_REQUEST, Endpoints } from './constants';
import { readRecordsResponse } from './recordsResponse';

import { DocLibServiceApi } from '@/components/journals/Journals/DocLib/DocLibServiceApi';
import { uploadContent } from '@/helpers/chunkedUpload';

const activeRequests = {};
const cancelledRequests = [];

self.addEventListener('message', e => {
  const { type, requestId } = e.data;
  if (type === ACTION_CANCEL_REQUEST && activeRequests[requestId]) {
    activeRequests[requestId].abort();
    delete activeRequests[requestId];
    cancelledRequests.push(requestId);
  }
});

self.onmessage = async event => {
  const { items: _items, rootId, folderId, totalCount: _totalCount, destinations = {}, ws } = event.data;
  const { file: destinationFile, dir: destinationDir } = destinations;

  let totalCount = _totalCount;
  let isAllReplace = false;

  const items = [];

  const isFoundItem = (item, children) =>
    children &&
    children.attributes &&
    children.attributes.nodeType &&
    children.attributes.name &&
    children.attributes.name === item.name &&
    children.attributes.nodeType === item.nodeType;

  try {
    // Inside the try: a records-error here (COREDEV-466) must reach the main thread as a fatal
    // UPLOAD_ERROR, not die as an unhandled rejection that leaves the saga waiting forever.
    const childrenRootDir = await getFolderItems(folderId, ws);

    for (const item of _items) {
      const foundItem = childrenRootDir.find(children => isFoundItem(item, children));

      switch (true) {
        case foundItem && foundItem.id && foundItem.attributes.nodeType === NODE_TYPES.FILE:
          const fileId = foundItem.id.split('$').pop();

          if (isAllReplace) {
            await deleteChild(fileId, item.file).then(res => res && items.push(item));
            break;
          }

          const { confirmed: isConfirmReplaceFile, isReplaceAllFiles } = await getConfirmationFromMainThread(item);

          if (isReplaceAllFiles) {
            isAllReplace = true;
          }

          if (isConfirmReplaceFile) {
            await deleteChild(fileId, item.file).then(res => res && items.push(item));
          } else {
            totalCount--;
          }

          break;

        case foundItem && foundItem.attributes.nodeType === NODE_TYPES.DIR && !!foundItem.id:
          const childrenFirstDir = await getFolderItems(foundItem.id, ws);
          const foldersWithChildren = await getAllFolders(item.files, childrenFirstDir, foundItem.attributes.name, ws);

          const dirFiles = [];
          for (const file of item.files) {
            const pathFile = file.path.substring(0, file.path.lastIndexOf('/'));

            if (pathFile && foldersWithChildren[pathFile] && foldersWithChildren[pathFile].length) {
              const foundDuplicateFile = foldersWithChildren[pathFile].find(
                child => child && child.id && child.attributes && child.attributes.name && child.attributes.name === file.name
              );

              if (foundDuplicateFile && foundDuplicateFile.id) {
                const fileId = foundDuplicateFile.id.split('$').pop();

                if (isAllReplace) {
                  await deleteChild(fileId, file.file).then(res => res && dirFiles.push(file));
                  continue;
                }

                const { confirmed: isConfirmReplaceFile, isReplaceAllFiles } = await getConfirmationFromMainThread(file);

                if (isReplaceAllFiles) {
                  isAllReplace = true;
                }

                if (isConfirmReplaceFile) {
                  await deleteChild(fileId, file.file).then(res => res && dirFiles.push(file));
                } else {
                  totalCount--;
                }
              } else {
                dirFiles.push(file);
              }
            } else {
              dirFiles.push(file);
            }
          }

          if (dirFiles.length > 0) {
            items.push({ ...item, files: dirFiles, alreadyExits: true, id: foundItem.id });
          } else {
            items.push({ ...item, alreadyExits: true, id: foundItem.id });
          }

          break;

        default:
          items.push(item);
          break;
      }
    }

    await handleUploads({ items, folderId, rootId, destinationFile, destinationDir, totalCount, ws });
  } catch (e) {
    postFatalError(e);
  }
};

// The whole batch is over and UPLOAD_SUCCESS will never follow: `isFatal` lets the saga release
// its upload promise. Only the text crosses the boundary — an Error instance does not reliably
// survive structured cloning.
function postFatalError(error) {
  const errorMessage = error && error.message ? error.message : String(error || '');
  self.postMessage({ status: WORKER_STATUSES.UPLOAD_ERROR, errorMessage, isFatal: true });
}

async function getAllFolders(files, childrenRootDir, rootFolderTitle, ws) {
  const uniqueFolders = new Set();
  const foldersWithChildren = {};

  const isFoundDir = (path, children) =>
    children &&
    children.id &&
    children.attributes &&
    children.attributes.name &&
    children.attributes.nodeType === NODE_TYPES.DIR &&
    children.attributes.name === path;

  for (const file of files) {
    const foundPath = file.path.substring(0, file.path.lastIndexOf('/'));
    uniqueFolders.add(foundPath);
  }

  for (let folder of uniqueFolders) {
    if (folder === rootFolderTitle) {
      foldersWithChildren[rootFolderTitle] = childrenRootDir;
    } else if (folder.includes('/')) {
      folder = folder.replace(`${rootFolderTitle}/`, '');
      let lastPathFolder = rootFolderTitle;
      let lastIdFolder = null;
      const folders = folder.split('/');

      for (const path of folders) {
        const index = folders.indexOf(path);

        if (index === 0) {
          const foundFolder = childrenRootDir.find(children => isFoundDir(path, children));
          lastPathFolder += '/' + path;

          if (foundFolder && foundFolder.id) {
            if (!foldersWithChildren[lastPathFolder]) {
              foldersWithChildren[lastPathFolder] = await getFolderItems(foundFolder.id, ws);
            }

            if (foundFolder.attributes.hasChildrenDirs) {
              lastIdFolder = foundFolder.id;
            } else {
              lastIdFolder = null;
            }
          } else {
            lastIdFolder = null;
            break;
          }
        } else if (lastIdFolder && lastPathFolder) {
          const foundFolder = foldersWithChildren[lastPathFolder].find(children => isFoundDir(path, children));
          lastPathFolder += '/' + path;

          if (foundFolder && foundFolder.id) {
            if (!foldersWithChildren[lastPathFolder]) {
              foldersWithChildren[lastPathFolder] = await getFolderItems(foundFolder.id, ws);
            }

            if (foundFolder.attributes.hasChildrenDirs) {
              lastIdFolder = foundFolder.id;
            } else {
              lastIdFolder = null;
            }
          } else {
            lastIdFolder = null;
            break;
          }
        }
      }
    }
  }

  return foldersWithChildren;
}

async function handleUploads({ items, folderId, rootId, destinationFile, destinationDir, totalCount, ws }) {
  try {
    self.postMessage({ status: WORKER_STATUSES.START_INIT_HANDLERS });

    // TODO: Sequential download of files and folders. We need to make a parallel one.
    let successFileCount = 0;
    const result = [];
    const createdDirectories = {};

    for (const item of items) {
      if (item.nodeType === NODE_TYPES.FILE && item.file) {
        const uploadFileResult = await handleUploadFile({
          file: item.file,
          dirId: folderId,
          rootId,
          destinationFile,
          totalCount,
          successFileCount,
          ws
        });

        if (uploadFileResult) {
          successFileCount++;
          result.push(uploadFileResult);
        }
      } else if (item.nodeType === NODE_TYPES.DIR && item.files) {
        const createDirResult =
          item.alreadyExits && item.id
            ? { id: item.id }
            : await handleUploadDirectory({ dirName: item.name, parentId: folderId, rootId, destinationDir, ws });

        if (createDirResult && createDirResult.id && item.files && item.files.length) {
          createdDirectories[item.name] = { id: createDirResult.id };

          for (const file of item.files) {
            if (file.path) {
              const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));

              const folders = folderPath.split('/');
              let indexFolder = folders[0];

              for (const folder of folders) {
                const index = folders.indexOf(folder);
                const newIndexFolder = indexFolder + '/' + folder;

                if (!createdDirectories[newIndexFolder] || !createdDirectories[newIndexFolder].id) {
                  if (index > 0 && createdDirectories[indexFolder] && createdDirectories[indexFolder].id) {
                    const createFolderResult = await handleUploadDirectory({
                      dirName: folder,
                      parentId: createdDirectories[indexFolder].id,
                      rootId,
                      destinationDir,
                      ws
                    });

                    indexFolder = newIndexFolder;
                    createdDirectories[indexFolder] = { id: createFolderResult.id };
                  }
                } else {
                  indexFolder = newIndexFolder;
                }
              }

              if (folderPath && folderPath !== item.name && createdDirectories[folderPath] && createdDirectories[folderPath].id) {
                const uploadFileResult = await handleUploadFile({
                  file: file.file,
                  dirId: createdDirectories[folderPath].id,
                  rootId,
                  destinationFile,
                  totalCount,
                  successFileCount,
                  ws
                });

                if (uploadFileResult) {
                  result.push(uploadFileResult);
                  successFileCount++;
                }
              } else if (folderPath && folderPath === item.name) {
                const uploadFileResult = await handleUploadFile({
                  file: file.file,
                  dirId: createDirResult.id,
                  rootId,
                  destinationFile,
                  totalCount,
                  successFileCount,
                  ws
                });

                if (uploadFileResult) {
                  result.push(uploadFileResult);
                  successFileCount++;
                }
              }
            }
          }
        }
      } else {
        self.postMessage({ status: WORKER_STATUSES.UPLOAD_ERROR });
      }
    }

    // TODO: An example of parallel file upload. We need to refine the backend to make it work.
    /*const result = await Promise.all(files.map(async (file) => {
      return await handleUploadFile({ file, dirId: folderId, rootId, destinationFile });
    }));*/

    self.postMessage({ status: WORKER_STATUSES.UPLOAD_SUCCESS, result });
  } catch (error) {
    postFatalError(error);
  }
}

function getConfirmationFromMainThread(file) {
  return new Promise(resolve => {
    self.postMessage({ status: WORKER_STATUSES.CONFIRM_FILE_REPLACE, file: { file, isLoading: true, isError: false } });

    self.onmessage = event => {
      if (event.data.status === WORKER_STATUSES.CONFIRM_FILE_RESPONSE) {
        resolve({ confirmed: event.data.confirmed, isReplaceAllFiles: event.data.isReplaceAllFiles });
      }
    };
  });
}

async function getFolderItems(parentRef, ws) {
  const query = { parentRef };

  const querySettings = {
    sourceId: SourcesId.DOCLIB,
    query,
    language: 'children',
    sortBy: [
      { attribute: 'nodeType', ascending: true },
      { attribute: '?disp', ascending: true }
    ]
  };

  if (!!ws) {
    querySettings.workspaces = [ws];
  }

  const response = await citeckFetch(Endpoints.QUERY, {
    body: {
      attributes: DocLibServiceApi.defaultAttributes,
      query: querySettings,
      version: 1
    },
    method: 'POST'
  });

  const { ok, errorMessage, errorStatus, body } = await readRecordsResponse(response);

  if (!ok) {
    // Returning [] here would hide existing children and let the upload create duplicates.
    throw new Error(errorMessage || `Failed to load folder children (HTTP ${errorStatus})`);
  }

  return (body && body.records) || [];
}

// Replacing an existing file starts with deleting it. A failure is reported for that file
// (COREDEV-466: including a records-error text on HTTP 200), and the caller skips the re-upload.
async function deleteChild(record, file) {
  const response = await citeckFetch(Endpoints.DELETE_CHILDREN, {
    body: {
      records: [record],
      version: 1
    },
    method: 'POST'
  });

  const { ok, errorStatus, errorMessage } = await readRecordsResponse(response);

  if (!ok) {
    self.postMessage({
      status: WORKER_STATUSES.UPLOAD_ERROR,
      errorStatus,
      errorMessage,
      file: { file, isLoading: false, isError: true }
    });
  }

  return ok;
}

async function handleUploadDirectory({ dirName, parentId, destinationDir, rootId, ws }) {
  const convertDir = prepareUploadedDirDataForSaving({ name: dirName });

  if (!convertDir) {
    return Promise.reject('Error: Error when converting a dir');
  }

  const folderItems = await getFolderItems(parentId, ws);
  const foundFolder = (folderItems || []).find(
    item => get(item, 'attributes.nodeType') === NODE_TYPES.DIR && get(item, 'attributes.name') === get(convertDir, '_name')
  );

  if (foundFolder) {
    return foundFolder;
  }

  const { ok, errorStatus, errorMessage, body } = await createChild(rootId, parentId, destinationDir, convertDir, ws);

  if (!ok) {
    self.postMessage({
      status: WORKER_STATUSES.UPLOAD_ERROR,
      typeCurrentItem: NODE_TYPES.DIR,
      targetDirTitle: get(convertDir, '_name'),
      errorStatus,
      errorMessage
    });
    return undefined;
  }

  if (body && body.records && body.records.length) {
    return body.records[0];
  }

  return body;
}

async function handleUploadFile({ file, dirId, rootId, destinationFile, totalCount, successFileCount, ws }) {
  const requestId = `${file.name || ''}-${file.size || 0}-${file.lastModified || 0}-${dirId}`;

  // `uploadContent`'s own control facade (captured from the first `handleProgress` call below)
  // only knows how to cancel the upload/session it manages. The record-creation request further
  // down (`createChild`) is a separate fetch this function owns directly, so it keeps its own
  // AbortController. `ACTION_CANCEL_REQUEST` just does `activeRequests[requestId].abort()` — this
  // object's `.abort()` cancels whichever of the two requests is currently in flight.
  const createChildController = new AbortController();
  let uploadControlFacade = null;

  activeRequests[requestId] = {
    abort() {
      createChildController.abort();
      if (uploadControlFacade) {
        uploadControlFacade.abort();
      }
    }
  };

  self.postMessage({
    status: WORKER_STATUSES.PROGRESS_UPDATE,
    requestId,
    totalCount,
    successFileCount,
    file: { file, isLoading: true, isError: false }
  });

  let uploadResult;
  try {
    uploadResult = await uploadContent(file, {
      name: file.name,
      // No `ecosType` here, deliberately. On the server, `uploadImpl` branches on exactly this —
      // an empty `ecosType` goes through `ecosContentService.uploadTempFile()` (a temp-file record that
      // `createChild` below then attaches to the real doc-lib record), while a non-empty one goes
      // through `uploadFile().withEcosType(...)` and creates a *different* record of that type
      // directly. Passing `destinationFile` here would silently switch which of those two
      // happens on top of the `createChild` call that still runs afterwards. `workspace` is safe
      // to pass — the chunked path already threads it through its init body.
      workspace: ws,
      urlBase: Endpoints.CONTENT,
      handleProgress: (state, controlFacade) => {
        // Captured on every call (including the synchronous PREPARING emission before
        // uploadContent's first await), so it is set before any cancel message can arrive.
        uploadControlFacade = controlFacade;
      }
    });
  } catch (err) {
    // uploadContent always rejects with an UploadError (see src/helpers/chunkedUpload/index.js
    // header comment, "Rejection contract") — `.status` is the HTTP status when known (e.g. 413),
    // which UploadStatus.jsx keys off for the size-specific error message. `.reason` (plus its
    // paired limit field) is present instead for a chunked-upload-rejected error — forwarded as
    // separate primitives, never the `UploadError` instance itself, since only primitives
    // reliably survive the postMessage/structured-clone boundary. UploadStatus.jsx localises
    // `errorReason` into user-facing text.
    self.postMessage({
      status: WORKER_STATUSES.UPLOAD_ERROR,
      errorStatus: err && err.status,
      errorReason: err && err.reason,
      errorMaxSingleUploadSize: err && err.maxSingleUploadSize,
      errorMaxFileSize: err && err.maxFileSize,
      totalCount,
      successFileCount,
      isCancelled: cancelledRequests.includes(requestId),
      file: { file, isLoading: false, isError: true }
    });
    return undefined;
  }

  const { entityRef = null } = uploadResult || {};
  if (!entityRef) {
    return Promise.reject('Error: No file entityRef');
  }

  const uploadedFile = {
    size: file.size,
    name: file.name,
    data: { entityRef }
  };

  const convertFile = prepareUploadedFileDataForSaving(file, uploadedFile);
  if (!convertFile) {
    return Promise.reject('Error: Error when converting a file');
  }

  let created;
  try {
    created = await createChild(rootId, dirId, destinationFile, convertFile, ws, createChildController.signal);
  } catch (e) {
    // Network failure or abort — no status and no server text to show.
    created = { ok: false };
  }

  if (!created.ok) {
    self.postMessage({
      status: WORKER_STATUSES.UPLOAD_ERROR,
      errorStatus: created.errorStatus,
      errorMessage: created.errorMessage,
      totalCount,
      successFileCount,
      isCancelled: cancelledRequests.includes(requestId),
      file: { file, isLoading: false, isError: true }
    });
    return undefined;
  }

  self.postMessage({
    status: WORKER_STATUSES.PROGRESS_UPDATE,
    totalCount,
    successFileCount: successFileCount + 1,
    file: { file, isLoading: false, isError: false },
    requestId
  });

  return created.body;
}

function prepareUploadedDirDataForSaving(dir = {}) {
  const name = dir && dir.name ? dir.name : null;

  if (!name) {
    return null;
  }

  return {
    submit: true,
    _name: name
  };
}

function prepareUploadedFileDataForSaving(file = {}, uploadedData = {}) {
  const name = uploadedData && uploadedData.name ? uploadedData.name : null;
  const data = uploadedData && uploadedData.data ? uploadedData.data : {};
  const size = uploadedData && uploadedData.size ? uploadedData.size : 0;

  if (!name) {
    return null;
  }

  return {
    submit: true,
    _name: name,
    _content: [
      {
        data: { ...data, ...file },
        name,
        originalName: name,
        size: size,
        storage: 'url',
        type: file.type
      }
    ]
  };
}

async function createChild(rootId, parentId, typeRef, attributes = {}, ws = '', signal) {
  const parent = parentId || rootId;

  const atts = {
    _parent: parent,
    _type: typeRef,
    ...attributes
  };

  if (!!ws) {
    atts._workspace = ws;
  }

  const record = {
    attributes: atts,
    id: rootId
  };

  // Resolves to readRecordsResponse's shape: `ok` is false on HTTP 200 + ERROR message too.
  const response = await citeckFetch('/gateway/api/records/mutate', {
    body: { records: [record] },
    method: 'POST',
    signal
  });

  return readRecordsResponse(response);
}

async function citeckFetch(path = '', options = {}) {
  const { method, headers = {}, body, mode, signal } = options;

  const url = `${self.location.origin}${path}`;
  const timezoneOffset = -new Date().getTimezoneOffset();

  const params = {
    signal,
    credentials: 'include',
    headers: {
      ...headers,
      'X-ECOS-Timezone': timezoneOffset
    }
  };

  if (mode) {
    params.mode = mode;
  }

  if (method) {
    params.method = method;
  }

  if (body instanceof FormData || typeof body === 'string') {
    params.body = body;
  } else if (!!body) {
    params.body = JSON.stringify(body);
    if (!params.headers['Content-type'] && !params.headers['Content-Type'] && !params.headers['content-type']) {
      params.headers['Content-type'] = 'application/json;charset=UTF-8';
    }
  }

  return fetch(url, params).then(resp => {
    return resp;
  });
}

export {}; // so that TS understands that this is a module
