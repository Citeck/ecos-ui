// The orgstructure page looks its dashboards up in the `orgstructure` scope. With a person picked it
// is a dashboard of the person type that differs from the one of the person's profile; with nobody
// picked it is the page's own dashboard type, `orgstructure-dashboard`.

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn(), queryOne: jest.fn() }
}));

import { EmodelTypes } from '@citeck/constants';
import Records from '@citeck/records-core';

import { DashboardApi } from '../dashboard';

const PERSON = 'emodel/person@ivan';
const PERSON_TYPE = 'emodel/type@person';

describe('DashboardApi.getDashboardByRecordRef', () => {
  const api = new DashboardApi();
  let citeck;

  // The api keeps a module-level cache keyed by the user, so every case runs as a user of its own
  const openAs = (user, url) => {
    window.Citeck = { ...window.Citeck, constants: { ...window.Citeck.constants, USERNAME: user } };
    window.history.replaceState({}, '', url);
  };

  // Records.queryOne is called twice: for the type key ('typeRef?id') and for the dashboard itself
  const dashboardQueries = () => Records.queryOne.mock.calls.filter(([, atts]) => atts !== 'typeRef?id').map(([{ query }]) => query);

  beforeAll(() => {
    citeck = window.Citeck;
    window.Citeck = { ...citeck };
  });

  afterAll(() => {
    window.Citeck = citeck;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    Records.get.mockReturnValue({ load: jest.fn().mockResolvedValue(PERSON_TYPE) });
    Records.queryOne.mockImplementation((request, atts) => {
      if (atts === 'typeRef?id') {
        return Promise.resolve(request.query.typeRef);
      }

      return Promise.resolve({ id: request.query.scope === 'orgstructure' ? 'orgstructure-dashboard-of-person' : 'profile-dashboard' });
    });
  });

  it('with nobody picked on the orgstructure page, asks for the orgstructure dashboard type in the orgstructure scope', async () => {
    openAs('user-without-pick', '/v2/orgstructure');

    await api.getDashboardByRecordRef('');

    expect(dashboardQueries()).toEqual([
      {
        typeRef: EmodelTypes.ORGSTRUCTURE_DASHBOARD,
        authority: 'user-without-pick',
        scope: 'orgstructure'
      }
    ]);
  });

  it('with a person picked on the orgstructure page, asks for the person type in the orgstructure scope', async () => {
    openAs('user-with-pick', `/v2/orgstructure?recordRef=${PERSON}`);

    await api.getDashboardByRecordRef(PERSON);

    expect(dashboardQueries()).toEqual([
      {
        typeRef: PERSON_TYPE,
        authority: 'user-with-pick',
        recordRef: PERSON,
        scope: 'orgstructure'
      }
    ]);
  });

  it('does not hand the dashboard of a profile to the same person opened in the orgstructure, nor back', async () => {
    const user = 'user-visiting-both';

    openAs(user, `/v2/dashboard?recordRef=${PERSON}`);
    expect(await api.getDashboardByRecordRef(PERSON)).toEqual({ id: 'profile-dashboard' });

    openAs(user, `/v2/orgstructure?recordRef=${PERSON}`);
    expect(await api.getDashboardByRecordRef(PERSON)).toEqual({ id: 'orgstructure-dashboard-of-person' });

    openAs(user, `/v2/dashboard?recordRef=${PERSON}`);
    expect(await api.getDashboardByRecordRef(PERSON)).toEqual({ id: 'profile-dashboard' });
  });
});
