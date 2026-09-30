import Records from '@citeck/records-core';

// Loads the api through its component chain, the way the app does; importing the api first hits an import cycle
import '../../components/common/Orgstruct';
import { OrgStructApi } from '../orgStruct';

jest.mock('@citeck/records-core', () => {
  const mock = {
    get: jest.fn().mockReturnValue({
      load: jest.fn().mockResolvedValue(false)
    }),
    query: jest.fn().mockResolvedValue({ records: [] })
  };
  return {
    __esModule: true,
    default: mock
  };
});

jest.mock('../../services/config/ConfigService', () => ({
  __esModule: true,
  ...jest.requireActual('../../services/config/ConfigService'),
  default: {
    getValue: jest.fn().mockResolvedValue(null)
  }
}));

const GROUP_RESTRICTION = { t: 'contains', att: 'authorityGroupsFull', val: 'company' };

const fetchGroup = async params => {
  await new OrgStructApi().fetchGroup(params);

  const [groupsQuery, usersQuery] = Records.query.mock.calls.map(([query]) => query.query.v);
  return { groupsQuery, usersQuery };
};

describe('OrgStructApi.fetchGroup', () => {
  beforeEach(() => {
    Records.query.mockClear();
  });

  it('limits search to the root group by default', async () => {
    const { groupsQuery, usersQuery } = await fetchGroup({ query: { groupName: 'company', searchText: 'ivan' } });

    expect(groupsQuery).toContainEqual(GROUP_RESTRICTION);
    expect(usersQuery).toContainEqual(GROUP_RESTRICTION);
  });

  it('searches across all groups when isSearchInAllGroups is set', async () => {
    const { groupsQuery, usersQuery } = await fetchGroup({
      query: { groupName: 'company', searchText: 'ivan' },
      isSearchInAllGroups: true
    });

    expect(groupsQuery).not.toContainEqual(GROUP_RESTRICTION);
    expect(usersQuery).not.toContainEqual(GROUP_RESTRICTION);
  });

  it('still lists only root group members without search text', async () => {
    const { groupsQuery, usersQuery } = await fetchGroup({
      query: { groupName: 'company', searchText: '' },
      isSearchInAllGroups: true
    });

    const membersPredicate = { t: 'contains', a: 'authorityGroups', v: 'emodel/authority-group@company' };
    expect(groupsQuery).toContainEqual(membersPredicate);
    expect(usersQuery).toContainEqual(membersPredicate);
  });
});
