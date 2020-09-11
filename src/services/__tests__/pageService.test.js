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
    ['https://community.ecos24.ru/v2/dashboard', PageTypes.DASHBOARD],
    [
      'https://community.ecos24.ru/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      PageTypes.JOURNALS
    ],
    [
      'https://community.ecos24.ru/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      PageTypes.DASHBOARD
    ],
    [
      'https://community.ecos24.ru/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      PageTypes.SETTINGS
    ],
    ['https://community.ecos24.ru/v2/bpmn-designer', PageTypes.BPMN_DESIGNER],
    ['https://community.ecos24.ru/v2/timesheet', PageTypes.TIMESHEET]
  ])('Method getType', (input, output) => {
    it(output, async () => {
      expect(PageService.getType(input)).toEqual(output);
    });
  });

  describe.each([
    ['https://community.ecos24.ru/v2/dashboard', ''],
    [
      'https://community.ecos24.ru/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      'global-global-tasks'
    ],
    [
      'https://community.ecos24.ru/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72'
    ],
    [
      'https://community.ecos24.ru/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      '034cbe25-098c-48be-ac21-d69e5c7abc79'
    ],
    ['https://community.ecos24.ru/v2/bpmn-designer', ''],
    ['https://community.ecos24.ru/v2/timesheet', ''],
    ['https://community.ecos24.ru/v2/dashboard', '', 'test-type']
  ])('Method getKey', (link, output, type) => {
    it(output || 'without key', async () => {
      expect(PageService.getKey({ link, type })).toEqual(output);
    });
  });

  describe.each([
    ['https://community.ecos24.ru/v2/dashboard', 'dashboard-'],
    [
      'https://community.ecos24.ru/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      'journals-global-global-tasks'
    ],
    [
      'https://community.ecos24.ru/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'dashboard-workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72'
    ],
    [
      'https://community.ecos24.ru/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'dashboard/settings-034cbe25-098c-48be-ac21-d69e5c7abc79'
    ],
    ['https://community.ecos24.ru/v2/bpmn-designer', 'bpmn-designer-'],
    ['https://community.ecos24.ru/v2/timesheet', 'timesheet-'],
    ['https://community.ecos24.ru/v2/dashboard', 'test-type-', 'test-type'],
    ['https://community.ecos24.ru/v2/dashboard', 'test-type-test-key', 'test-type', 'test-key']
  ])('Method getId', (link, output, type, key) => {
    it(output, async () => {
      expect(PageService.keyId({ link, type, key })).toEqual(output);
    });
  });

  describe.each([
    ['https://community.ecos24.ru/v2/dashboard', 'header.site-menu.home-page'],
    [
      'https://community.ecos24.ru/v2/journals?journalId=workspace://SpacesStore/journal-meta-j-active-tasks&journalSettingId=&journalsListId=global-global-tasks',
      `page-tabs.journal \"${TITLE}\"`
    ],
    ['https://community.ecos24.ru/v2/dashboard?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72', TITLE],
    [
      'https://community.ecos24.ru/v2/dashboard/settings?dashboardId=034cbe25-098c-48be-ac21-d69e5c7abc79&recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      `page-tabs.dashboard-settings \"${TITLE}\"`
    ],
    ['https://community.ecos24.ru/v2/bpmn-designer', 'page-tabs.bpmn-designer'],
    ['https://community.ecos24.ru/v2/timesheet', 'page-tabs.timesheet']
  ])('Method getTitle by type', (link, output) => {
    it(output, async () => {
      const type = PageService.getType(link);
      const getTitle = PageService.pageTypes[type].getTitle;
      const props = queryString.parseUrl(link).query;
      const title = await getTitle(props);

      expect(title).toEqual(output);
    });
  });
});
