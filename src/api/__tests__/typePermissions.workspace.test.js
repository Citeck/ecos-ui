import Records from '@citeck/records-core';

import { TypePermissionsApi } from '../typePermissions';

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { queryOne: jest.fn(), get: jest.fn(), remove: jest.fn() }
}));

describe('permission matrices in workspaces', () => {
  it.each(['emodel/type@team:contract', 'emodel/type@contract'])('saves "%s" without an explicit workspace context', async typeRef => {
    const record = { att: jest.fn(), save: jest.fn().mockResolvedValue('saved') };
    Records.get.mockReturnValue(record);
    await expect(
      TypePermissionsApi.savePermissions({
        id: 'emodel/perms@',
        typeRef,
        workspace: 'computed-workspace',
        permissions: {},
        attributes: {}
      })
    ).resolves.toBe('saved');
    expect(record.att).not.toHaveBeenCalledWith('workspace', expect.anything());
    expect(record.att).not.toHaveBeenCalledWith('_workspace', expect.anything());
    expect(record.att).toHaveBeenCalledWith('typeRef?id', typeRef);
  });

  it('waits for deletion and passes the matrix ref, not its data object', async () => {
    const result = { status: 'deleted' };
    Records.remove.mockResolvedValue(result);
    await expect(TypePermissionsApi.deleteTypePermissions({ id: 'emodel/perms@team:contract' })).resolves.toBe(result);
    expect(Records.remove).toHaveBeenCalledWith(['emodel/perms@team:contract']);
  });

  it('loads the workspace from the resolved type workspaceRef', async () => {
    const load = jest.fn().mockResolvedValue({ workspace: 'team-workspace' });
    Records.get.mockReturnValue({ load });
    await TypePermissionsApi.getTypeInfo('emodel/type@team:contract');
    expect(Records.get).toHaveBeenCalledWith('emodel/rtype@team:contract');
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ workspace: 'workspaceRef?localId' }), true);
  });
});
