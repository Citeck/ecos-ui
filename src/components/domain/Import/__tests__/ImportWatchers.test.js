import Records from '@citeck/records-core';

import ConnectedImport from '../Import';

import { WORKER_STATUSES } from '@/workers/docLib/constants';

// FormManager pulls in EcosForm and the record actions import cycle; Import only opens dialogs through it.
jest.mock('@/components/forms/EcosForm/FormManager', () => ({
  __esModule: true,
  default: { createRecordByVariant: () => {}, openFormModal: () => {} }
}));

// The import progress is followed through a watcher on the import record, which is a global
// Records.get(ref) cache entry: a watcher that is never removed keeps posting progress to the
// service worker for a component that is gone (COREDEV-522).
describe('Import record watchers', () => {
  const Import = ConnectedImport.WrappedComponent;
  const importRecord = 'integrations/import@watchers';
  const fileData = { file: { name: 'rows.xlsx' } };
  const watchers = () => Records.get(importRecord)._watchers.length;
  const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
  let postMessage;

  beforeAll(() => {
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: {} });
    jest.spyOn(Records.get(importRecord), 'load').mockImplementation(atts => Promise.resolve(Array.isArray(atts) ? {} : false));
  });

  beforeEach(() => {
    postMessage = jest.fn();
    window.navigator.serviceWorker.controller = { postMessage };
  });

  const createImport = () => new Import({ stateId: 'journal-state', deselectAllRecords: jest.fn(), reloadGrid: jest.fn() });

  it('watches the import record after submit and stops watching on unmount', async () => {
    const instance = createImport();

    await instance.handleSubmit(fileData, importRecord);
    expect(watchers()).toBe(1);

    instance.componentWillUnmount();
    expect(watchers()).toBe(0);
  });

  it('stops watching once the import reports that it has stopped', async () => {
    const instance = createImport();

    await instance.handleSubmit(fileData, importRecord);
    await flushPromises();
    const watcher = Records.get(importRecord)._watchers[0];

    watcher.setAttributes({ 'processedRowCount?num': 3, 'rowCount?num': 5, '?json': { state: 'RUNNING' } });
    watcher.setAttributes({ 'processedRowCount?num': 5, 'rowCount?num': 5, '?json': { state: 'STOPPED' } });

    expect(watchers()).toBe(0);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ status: WORKER_STATUSES.UPLOAD_SUCCESS }));

    instance.componentWillUnmount();
  });

  it('does not leave a watcher behind when the component unmounts before the first load answers', async () => {
    const instance = createImport();

    const submit = instance.handleSubmit(fileData, importRecord);
    instance.componentWillUnmount();
    await submit;

    expect(watchers()).toBe(0);
  });

  it('does not pile up watchers over repeated imports', async () => {
    for (let i = 0; i < 5; i++) {
      const instance = createImport();
      await instance.handleSubmit(fileData, importRecord);
      instance.componentWillUnmount();
    }

    expect(watchers()).toBe(0);
  });
});
