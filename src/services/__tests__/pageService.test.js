import PageService, { PageTypes } from '../PageService';

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
    ['https://community.ecos24.ru/v2/timesheet', '']
  ])('Method getKey', (link, output) => {
    it(output || 'without key', async () => {
      expect(PageService.getKey({ link })).toEqual(output);
    });
  });
});
