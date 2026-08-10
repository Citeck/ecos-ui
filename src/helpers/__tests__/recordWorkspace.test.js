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

import { getFormDataWorkspaceId, resolveRecordWorkspaceId, toWorkspaceRef } from '../recordWorkspace';

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

  it('does not load a record that does not exist yet', async () => {
    await expect(resolveRecordWorkspaceId('emodel/task@')).resolves.toBe('user$admin');
    await expect(resolveRecordWorkspaceId('@')).resolves.toBe('user$admin');
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

describe('toWorkspaceRef', () => {
  it('prefixes the local id with the workspace source', () => {
    expect(toWorkspaceRef('TEST2')).toBe('emodel/workspace@TEST2');
  });

  it('is the inverse of the parsing getFormDataWorkspaceId does', () => {
    expect(getFormDataWorkspaceId({ _workspace: toWorkspaceRef('TEST2') })).toBe('TEST2');
  });
});

describe('getFormDataWorkspaceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnabledWorkspaces.mockReturnValue(true);
  });

  it('extracts the local id from a workspace ref', () => {
    expect(getFormDataWorkspaceId({ _workspace: 'emodel/workspace@TEST2' })).toBe('TEST2');
  });

  it('accepts a bare local id', () => {
    expect(getFormDataWorkspaceId({ _workspace: 'TEST2' })).toBe('TEST2');
  });

  it('keeps ids containing a dollar sign', () => {
    expect(getFormDataWorkspaceId({ _workspace: 'emodel/workspace@user$admin' })).toBe('user$admin');
  });

  it('accepts an object with an id', () => {
    expect(getFormDataWorkspaceId({ _workspace: { id: 'emodel/workspace@TEST2' } })).toBe('TEST2');
  });

  it('takes the first element of an array', () => {
    expect(getFormDataWorkspaceId({ _workspace: ['emodel/workspace@TEST2'] })).toBe('TEST2');
  });

  it('returns empty for a ref of another source, so the caller falls back', () => {
    expect(getFormDataWorkspaceId({ _workspace: 'emodel/project@TEST2' })).toBe('');
  });

  it('returns empty when _workspace is absent', () => {
    expect(getFormDataWorkspaceId({ summary: 'x' })).toBe('');
  });

  it('returns empty for a null value produced by calculateValue', () => {
    expect(getFormDataWorkspaceId({ _workspace: null })).toBe('');
  });

  it('returns empty for empty form data', () => {
    expect(getFormDataWorkspaceId(undefined)).toBe('');
    expect(getFormDataWorkspaceId(null)).toBe('');
  });

  it('returns empty when workspaces are disabled', () => {
    getEnabledWorkspaces.mockReturnValue(false);

    expect(getFormDataWorkspaceId({ _workspace: 'emodel/workspace@TEST2' })).toBe('');
  });
});
