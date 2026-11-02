import Records from '@citeck/records-core';

import { MenuApi } from '../menu';

jest.mock('@/components/common/Orgstruct', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/form/SelectOrgstruct', () => ({ __esModule: true, default: () => null }));
jest.mock('@citeck/records-core', () => ({ __esModule: true, default: { get: jest.fn() } }));

it.each([
  null,
  {},
  { version: null, authorities: [] },
  { version: 3, authorities: null },
  { notExists: true, version: 3, authorities: [] }
])('rejects unreadable/incomplete menu configuration %p before filling defaults', async config => {
  Records.get.mockReturnValue({ load: jest.fn().mockResolvedValue(config) });
  const api = new MenuApi();
  api.getAuthoritiesInfo = jest.fn();
  await expect(api.getMenuSettingsConfig({ id: 'test-menu' })).rejects.toThrow('missing or invalid');
  expect(api.getAuthoritiesInfo).not.toHaveBeenCalled();
});

it('accepts an empty newly created menu with a real version', async () => {
  Records.get.mockReturnValue({ load: jest.fn().mockResolvedValue({ id: 'test-menu', version: 1, authorities: [], menu: null }) });
  const api = new MenuApi();
  api.getAuthoritiesInfo = jest.fn().mockResolvedValue([]);
  await expect(api.getMenuSettingsConfig({ id: 'test-menu' })).resolves.toMatchObject({
    version: 1,
    menu: { left: { items: [] }, create: { items: [] }, user: { items: [] } },
    authorities: []
  });
});
