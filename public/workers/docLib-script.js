/* eslint-disable no-restricted-globals */

const activeRequests = {};
const cancelledRequests = [];

self.addEventListener('message', e => {
  const { type, requestId } = e.data;
  if (type === 'CANCEL_REQUEST' && activeRequests[requestId]) {
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
  const childrenRootDir = await getFolderItems(folderId, ws);

  const isFoundItem = (item, children) =>
    children &&
    children.attributes &&
    children.attributes.nodeType &&
    children.attributes.name &&
    children.attributes.name === item.name &&
    children.attributes.nodeType === item.nodeType;

  try {
    for (const item of _items) {
      const foundItem = childrenRootDir.find(children => isFoundItem(item, children));

      switch (true) {
        case foundItem && foundItem.id && foundItem.attributes.nodeType === NODE_TYPES.FILE:
          const fileId = foundItem.id.split('$').pop();

          if (isAllReplace) {
            await deleteChild(fileId).then(res => res && items.push(item));
            break;
          }

          const { confirmed: isConfirmReplaceFile, isReplaceAllFiles } = await getConfirmationFromMainThread(item);

          if (isReplaceAllFiles) {
            isAllReplace = true;
          }

          if (isConfirmReplaceFile) {
            await deleteChild(fileId).then(res => res && items.push(item));
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
                  await deleteChild(fileId).then(res => res && dirFiles.push(file));
                  continue;
                }

                const { confirmed: isConfirmReplaceFile, isReplaceAllFiles } = await getConfirmationFromMainThread(file);

                if (isReplaceAllFiles) {
                  isAllReplace = true;
                }

                if (isConfirmReplaceFile) {
                  await deleteChild(fileId).then(res => res && dirFiles.push(file));
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
    self.postMessage({ status: 'error', error: e.message });
  }
};

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
    self.postMessage({ status: 'start' });

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
        self.postMessage({ status: 'error' });
      }
    }

    // TODO: An example of parallel file upload. We need to refine the backend to make it work.
    /*const result = await Promise.all(files.map(async (file) => {
      return await handleUploadFile({ file, dirId: folderId, rootId, destinationFile });
    }));*/

    self.postMessage({ status: 'success', result });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
}

function getConfirmationFromMainThread(file) {
  return new Promise(resolve => {
    self.postMessage({ status: 'confirm-file-replacement', file: { file, isLoading: true, isError: false } });

    self.onmessage = event => {
      if (event.data.status === 'confirmation-file-response') {
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

  const response = await citeckFetch('/gateway/api/records/query', {
    body: {
      attributes: defaultAttributesDocLib,
      query: querySettings,
      version: 1
    },
    method: 'POST'
  });

  const responseData = await response.json();

  if (responseData && responseData.records) {
    return responseData.records;
  }

  return [];
}

async function deleteChild(record) {
  const response = await citeckFetch('/gateway/api/records/delete', {
    body: {
      records: [record],
      version: 1
    },
    method: 'POST'
  });

  return response.ok;
}

async function handleUploadDirectory({ dirName, parentId, destinationDir, rootId, ws }) {
  const convertDir = prepareUploadedDirDataForSaving({ name: dirName });

  if (!convertDir) {
    return Promise.reject('Error: Error when converting a dir');
  }

  const result = await createChild(rootId, parentId, destinationDir, convertDir, ws).then(async res => await res.json());

  if (result && result.records && result.records.length) {
    return result.records[0];
  }

  return result;
}

async function handleUploadFile({ file, dirId, rootId, destinationFile, totalCount, successFileCount, ws }) {
  const controller = new AbortController();
  const signal = controller.signal;

  const requestId = `${file.name || ''}-${file.size || 0}-${file.lastModified || 0}-${dirId}`;
  activeRequests[requestId] = controller;

  self.postMessage({
    status: 'in-progress',
    requestId,
    totalCount,
    successFileCount,
    file: { file, isLoading: true, isError: false }
  });

  const formData = new FormData();

  formData.append('file', file);
  formData.append('name', file.name);

  if (!!ws) {
    formData.append('_workspace', ws);
  }

  const responseData = await citeckFetch('/gateway/emodel/api/ecos/webapp/content', {
    body: formData,
    method: 'POST',
    signal
  })
    .then(async res => {
      if (res.ok) {
        return await res.json();
      } else {
        self.postMessage({
          status: 'error',
          errorStatus: res.status,
          totalCount,
          successFileCount,
          isCancelled: cancelledRequests.includes(requestId),
          file: { file, isLoading: false, isError: true }
        });
      }
    })
    .catch(() => {
      self.postMessage({
        status: 'error',
        totalCount,
        successFileCount,
        isCancelled: cancelledRequests.includes(requestId),
        file: { file, isLoading: false, isError: true }
      });
    });

  if (!responseData) {
    return undefined;
  }

  const { entityRef = null } = responseData;
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

  return await createChild(rootId, dirId, destinationFile, convertFile, ws, signal)
    .then(async res => {
      self.postMessage({
        status: 'in-progress',
        totalCount,
        successFileCount: successFileCount + 1,
        file: { file, isLoading: false, isError: false },
        requestId
      });
      return await res.json();
    })
    .catch(() => {
      self.postMessage({
        status: 'error',
        totalCount,
        successFileCount,
        isCancelled: cancelledRequests.includes(requestId),
        file: { file, isLoading: false, isError: true }
      });
    });
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

  return citeckFetch('/gateway/api/records/mutate', {
    body: { records: [record] },
    method: 'POST',
    signal
  });
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

const NODE_TYPES = {
  DIR: 'DIR',
  FILE: 'FILE'
};

const SourcesId = {
  DOCLIB: 'emodel/doclib'
};

const defaultAttributesDocLib = {
  id: '?id',
  title: '?disp',
  nodeType: 'nodeType',
  hasChildrenDirs: 'hasChildrenDirs?bool',
  typeRef: '_type?id',
  modified: '_modified?str',
  name: '_name?str'
};
