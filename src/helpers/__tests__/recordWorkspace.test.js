jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('@/helpers/urls', () => ({
  __esModule: true,
  getWorkspaceId: jest.fn(() => 'user$admin')
}));

jest.mock('@/helpers/util', () => ({
  __esModule: true,
  getEnabledWorkspaces: jest.fn(() => true)
}));

import Records from '@citeck/records-core';

import { getEnabledWorkspaces } from '@/helpers/util';

import { resolveRecordWorkspaceId } from '../recordWorkspace';

const mockLoad = result => {
  Records.get.mockReturnValue({ load: jest.fn(() => result) });
};

describe('resolveRecordWorkspaceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnabledWorkspaces.mockReturnValue(true);
  });

  it('returns the workspace from the URL and skips Records when there is no ref', async () => {
    await expect(resolveRecordWorkspaceId('')).resolves.toBe('user$admin');
    expect(Records.get).not.toHaveBeenCalled();
  });

  it('does not touch Records when workspaces are disabled', async () => {
    getEnabledWorkspaces.mockReturnValue(false);

    await expect(resolveRecordWorkspaceId('emodel/task@task-1')).resolves.toBe('user$admin');
    expect(Records.get).not.toHaveBeenCalled();
  });

  it('returns the workspace of a record that has one', async () => {
    mockLoad(Promise.resolve('proj1'));

    await expect(resolveRecordWorkspaceId('emodel/task@task-1')).resolves.toBe('proj1');
    expect(Records.get).toHaveBeenCalledWith('emodel/task@task-1');
    expect(Records.get.mock.results[0].value.load).toHaveBeenCalledWith('_workspace?localId');
  });

  it('returns default for a global record with an empty _workspace', async () => {
    mockLoad(Promise.resolve(''));

    await expect(resolveRecordWorkspaceId('emodel/type@some-type')).resolves.toBe('default');
  });

  it('falls back to the workspace from the URL when loading fails', async () => {
    mockLoad(Promise.reject(new Error('boom')));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(resolveRecordWorkspaceId('emodel/task@task-1')).resolves.toBe('user$admin');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
