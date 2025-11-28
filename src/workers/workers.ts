export const WORKERS = {
  DOC_LIB: 'doc-lib'
};

export const workersUrls = {
  [WORKERS.DOC_LIB]: new URL('./docLib/worker.js', import.meta.url)
};
