import queryString from 'query-string';

import PageService, { PageTypes } from '../PageService';

const TITLE = 'Test label';

jest.spyOn(global, 'fetch').mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        records: [
          {
            id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
            attributes: {
              '.disp': TITLE
            }
          }
        ]
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
    ['/v2/admin', PageTypes.ADMIN_PAGE],
    ['/v2/dev-tools', PageTypes.ADMIN_PAGE],
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
    ['/v2/admin', ''],
    ['/v2/timesheet', ''],
    ['/v2/dashboard', '', 'test-type'],
    [
      '/v2/cmmn-editor?recordRef=workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72',
      'workspace://SpacesStore/2b21ae02-a5ec-48cb-8d20-5cb1dbd6fa72'
    ],
    // Saved Camel DSL route keys by recordRef.
    ['/v2/camel-dsl-editor?recordRef=integrations/camel-dsl@route-1', 'integrations/camel-dsl@route-1'],
    // New (unsaved) Camel DSL drafts key by their per-draft id so concurrent drafts get separate tabs.
    ['/v2/camel-dsl-editor?new=true&draftId=new-session-111', 'new-session-111'],
    ['/v2/camel-dsl-editor?new=true&draftId=new-session-222', 'new-session-222']
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
    ['/v2/admin?type=BPM', 'page-tabs.bpmn-designer'],
    ['/v2/admin?type=DMN', 'page-tabs.dmn-designer'],
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

  describe('changeUrlLink — skipUrlChangeGuards bypasses the global guard chain', () => {
    // Flush all pending microtasks (the guard chain dispatches CHANGE_URL only after the async reduce).
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));

    afterEach(() => {
      PageService.clearUrlChangeGuards();
      PageService.eventIsDispatched = false;
      jest.restoreAllMocks();
    });

    it('runs registered guards by default (no skip flag)', async () => {
      const guard = jest.fn().mockResolvedValue(true);
      PageService.registerUrlChangeGuard(guard, 'tab-1');
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent').mockReturnValue(true);

      PageService.changeUrlLink('/v2/camel-dsl-editor?new=true&draftId=d1', { updateUrl: true });
      await flush();

      expect(guard).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('skips the guard chain when skipUrlChangeGuards is true (same-tab metadata rewrite)', async () => {
      // A cached BPMN/DMN editor registers a workspace-change guard; a Camel same-tab metadata rewrite
      // must not trip it (no spurious confirm / cancel that would strand the tab on the old URL).
      const guard = jest.fn().mockResolvedValue(true);
      PageService.registerUrlChangeGuard(guard, 'tab-1');
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent').mockReturnValue(true);

      PageService.changeUrlLink('/v2/camel-dsl-editor?new=true&draftId=d1', { updateUrl: true, skipUrlChangeGuards: true });
      await flush();

      expect(guard).not.toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('does not leak skipUrlChangeGuards into the dispatched event params', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent').mockReturnValue(true);

      PageService.changeUrlLink('/v2/camel-dsl-editor?new=true&draftId=d1', { updateUrl: true, skipUrlChangeGuards: true });

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const dispatched = dispatchSpy.mock.calls[0][0];
      expect(dispatched.params.skipUrlChangeGuards).toBeUndefined();
      expect(dispatched.params.updateUrl).toBe(true);
    });
  });

  describe('rekeyWhereLinkOpen — keeps the opener resolvable after a tab rewrites its own key', () => {
    const PARENT = '/v2/journals?journalId=integrations';
    const NEW = '/v2/camel-dsl-editor?new=true';
    const DRAFT = '/v2/camel-dsl-editor?new=true&draftId=d1';
    const SAVED = '/v2/camel-dsl-editor?recordRef=integrations/camel-dsl@route-1';

    beforeEach(() => {
      window.localStorage.clear();
    });

    afterEach(() => {
      window.localStorage.clear();
    });

    it('without rekey the opener is lost once the key changes (regression guard)', () => {
      PageService.setWhereLinkOpen({ parentLink: PARENT, subsidiaryLink: NEW });

      // Tab pinned a draftId — lookup by the new key no longer matches the `?new=true` entry.
      expect(PageService.extractWhereLinkOpen({ subsidiaryLink: DRAFT })).toBeUndefined();
    });

    it('migrates the `?new=true` entry to the pinned draftId key', () => {
      PageService.setWhereLinkOpen({ parentLink: PARENT, subsidiaryLink: NEW });
      PageService.rekeyWhereLinkOpen({ fromLink: NEW, toLink: DRAFT });

      const opener = PageService.extractWhereLinkOpen({ subsidiaryLink: DRAFT });
      expect(opener).toBeTruthy();
      expect(opener).toContain('journalId=integrations');
    });

    it('migrates the draftId entry to the saved recordRef key (save transition)', () => {
      PageService.setWhereLinkOpen({ parentLink: PARENT, subsidiaryLink: NEW });
      PageService.rekeyWhereLinkOpen({ fromLink: NEW, toLink: DRAFT });
      PageService.rekeyWhereLinkOpen({ fromLink: DRAFT, toLink: SAVED });

      expect(PageService.extractWhereLinkOpen({ subsidiaryLink: SAVED })).toBeTruthy();
    });

    it('is a no-op when the key is unchanged and leaves no stale duplicate', () => {
      PageService.setWhereLinkOpen({ parentLink: PARENT, subsidiaryLink: SAVED });
      PageService.rekeyWhereLinkOpen({ fromLink: SAVED, toLink: SAVED });

      // First extract consumes the single entry; a second finds nothing (no duplicate was created).
      expect(PageService.extractWhereLinkOpen({ subsidiaryLink: SAVED })).toBeTruthy();
      expect(PageService.extractWhereLinkOpen({ subsidiaryLink: SAVED })).toBeUndefined();
    });
  });
});
