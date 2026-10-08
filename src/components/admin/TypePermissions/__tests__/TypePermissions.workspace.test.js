import { waitFor } from '@testing-library/react';

import TypePermissionsService from '../TypePermissionsService';

import { TypePermissionsApi } from '@/api/typePermissions';
import DownloadAction from '@/components/core/Records/actions/handler/executor/DownloadAction';

jest.mock('../TypePermissionsEditor', () => () => null);

jest.mock('@/api/typePermissions', () => ({
  TypePermissionsApi: {
    getTypePermissions: jest.fn(),
    getTypeInfo: jest.fn(),
    savePermissions: jest.fn()
  }
}));
jest.mock('@/components/common/dialogs/Manager', () => ({ showInfoDialog: jest.fn() }));
jest.mock('@/components/common/dialogs/Manager/DialogManager', () => ({ showRemoveDialog: jest.fn() }));
jest.mock('@/components/core/Records/actions/handler/executor/DownloadAction', () => ({ _downloadText: jest.fn() }));

const roles = [{ id: 'EVERYONE', name: 'Everyone' }];
const statuses = [{ id: 'draft', name: 'Draft' }];
const typeRef = 'emodel/type@team:contract';

beforeEach(() => {
  jest.clearAllMocks();
  TypePermissionsApi.getTypePermissions.mockResolvedValue(null);
  TypePermissionsApi.getTypeInfo.mockResolvedValue({
    workspace: 'team-workspace',
    typeDispName: 'Contract',
    roles,
    statuses,
    attributes: []
  });
  TypePermissionsApi.savePermissions.mockResolvedValue({});
});

afterEach(() => jest.restoreAllMocks());

it.each(['team-workspace', ''])('saves the canonical type reference with computed workspace "%s"', async workspace => {
  TypePermissionsApi.getTypeInfo.mockResolvedValue({ workspace, roles, statuses });
  const open = jest.spyOn(TypePermissionsService, 'openEditor').mockImplementation(() => {});
  const result = TypePermissionsService.editTypePermissions(typeRef);
  await waitFor(() => expect(open).toHaveBeenCalled());
  await open.mock.calls[0][0].onSave({ matrix: { EVERYONE: { draft: 'WRITE' } } });
  await expect(result).resolves.toBe(true);
  expect(TypePermissionsApi.savePermissions).toHaveBeenCalledWith(expect.objectContaining({ typeRef }));
  expect(TypePermissionsApi.savePermissions.mock.calls[0][0]).not.toHaveProperty('workspace');
});

it.each([
  {
    matrixRef: 'emodel/perms@team:contract',
    typeRef: 'emodel/type@team:contract',
    workspace: 'team-workspace',
    expectedId: 'contract',
    expectedTypeRef: 'emodel/type@CURRENT_WS:contract'
  },
  {
    matrixRef: 'emodel/perms@team:namespace:matrix',
    typeRef: 'emodel/type@team:namespace:contract',
    workspace: 'team-workspace',
    expectedId: 'namespace:matrix',
    expectedTypeRef: 'emodel/type@CURRENT_WS:namespace:contract'
  },
  {
    matrixRef: 'emodel/perms@namespace:contract',
    typeRef: 'emodel/type@namespace:contract',
    workspace: '',
    expectedId: 'namespace:contract',
    expectedTypeRef: 'emodel/type@namespace:contract'
  },
  {
    matrixRef: 'emodel/perms@contract',
    typeRef: 'emodel/type@team:contract',
    workspace: 'team-workspace',
    expectedId: 'contract',
    expectedTypeRef: 'emodel/type@CURRENT_WS:contract'
  }
])(
  'exports matrix $matrixRef preserving its local id and type namespace',
  async ({ matrixRef, typeRef, workspace, expectedId, expectedTypeRef }) => {
    TypePermissionsApi.getTypeInfo.mockResolvedValue({ workspace, roles, statuses, attributes: [] });
    TypePermissionsApi.getTypePermissions.mockResolvedValue({
      id: matrixRef,
      workspace,
      typeRef: 'emodel/type@stale-reference',
      permissions: { matrix: {} },
      attributes: {}
    });
    await TypePermissionsService.downloadPermissionsConfig(typeRef, [], [], []);
    const exported = JSON.parse(DownloadAction._downloadText.mock.calls[0][0]);
    expect(exported.id).toBe(expectedId);
    expect(exported.typeRef).toBe(expectedTypeRef);
    expect(exported).not.toHaveProperty('workspace');
  }
);
