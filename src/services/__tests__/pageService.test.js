import queryString from 'query-string';

import PageService, { PageTypes } from '../PageService';

const TITLE = 'Test label';

jest.spyOn(global, 'fetch').mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
        attributes: {
          '.disp': TITLE
        }
      })
  });
});

describe('Page Service', () => {
  describe.each([
    ['/v2/dashboard', PageTypes.DASHBOARD],
    [
      '/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      PageTypes.JOURNALS
    ],
    ['/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72', PageTypes.DASHBOARD],
    [
      '/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      PageTypes.SETTINGS
    ],
    ['/v2/admin', PageTypes.ADMIN_PAGE],
    ['/v2/timesheet', PageTypes.TIMESHEET],
    ['/v2/cmmn-editor', PageTypes.CMMN_EDITOR]
  ])('Method getType', (input, output) => {
    it(output, async () => {
      expect(PageService.getType(input)).toEqual(output);
    });
  });

  describe.each([
    ['/v2/dashboard', ''],
    [
      '/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      'workspace://SpacesStore/journal-meta-j-active-tasks'
    ],
    [
      '/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72'
    ],
    [
      '/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      '034cbe25-098c-48be-ac21-d69e5c7abc79'
    ],
    ['/v2/admin', ''],
    ['/v2/timesheet', ''],
    ['/v2/dashboard', '', 'test-type'],
    [
      '/v2/cmmn-editor?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72'
    ]
  ])('Method getKey', (link, output, type) => {
    it(output || 'without key', async () => {
      expect(PageService.getKey({ link, type })).toEqual(output);
    });
  });

  describe.each([
    ['/v2/dashboard', 'dashboard-'],
    [
      '/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      'journals-workspace://SpacesStore/journal-meta-j-active-tasks'
    ],
    [
      '/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'dashboard-workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72'
    ],
    [
      '/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'dashboard/settings-034cbe25-098c-48be-ac21-d69e5c7abc79'
    ],
    ['/v2/admin', 'admin-'],
    ['/v2/timesheet', 'timesheet-'],
    ['/v2/dashboard', 'test-type-', 'test-type'],
    ['/v2/dashboard', 'test-type-test-key', 'test-type', 'test-key']
  ])('Method getId', (link, output, type, key) => {
    it(output, async () => {
      expect(PageService.keyId({ link, type, key })).toEqual(output);
    });
  });

  describe.each([
    ['/v2/dashboard', 'header.site-menu.home-page'],
    [
      '/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      `page-tabs.journal \"${TITLE}\"`
    ],
    ['/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72', TITLE],
    [
      '/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      `page-tabs.dashboard-settings \"${TITLE}\"`
    ],
    ['/v2/admin?type=BPM', 'page-tabs.bpmn-designer'],
    ['/v2/timesheet', 'page-tabs.timesheet'],
    ['/v2/cmmn-editor?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72', `page-tabs.cmmn-editor \"${TITLE}\"`]
  ])('Method getTitle by type', (link, output) => {
    it(output, async () => {
      const getTitle = PageService.getPage({ link }).getTitle;
      const props = queryString.parseUrl(link).query;
      const title = await getTitle(props);

      expect(title).toEqual(output);
    });
  });
});
