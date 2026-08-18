// Capture the confirmation without rendering a dialog; `confirm` holds the last call's options.
const confirmCalls = [];
jest.mock('@/components/common/dialogs/Manager', () => ({
  __esModule: true,
  default: {
    confirmDialog: jest.fn(options => {
      confirmCalls.push(options);
    })
  }
}));

jest.mock('@/services/userLocalSettings', () => ({
  __esModule: true,
  default: { removeDataOnTab: jest.fn() }
}));

import PageService from '@/services/PageService';

import { PageTabs } from '../PageTabs';

// Every way of closing tabs funnels into two methods: `handleCloseTab` (cross, middle click, "Close")
// and `handleCloseTabs` (all the bulk context-menu actions and "Close all tabs"). Both must ask before
// deleting a tab whose page reports unsaved changes — a bulk action discards work just as finally as
// the cross does.
describe('PageTabs close guard — unsaved changes are asked about on every close path', () => {
  const tab = id => ({ id, link: `/v2/dashboard?x=${id}` });
  const tabs = [tab('tab-1'), tab('tab-2'), tab('tab-3')];

  const makeTabs = () =>
    new PageTabs({
      tabs,
      closeTabs: jest.fn(),
      deleteTab: jest.fn(),
      updateTabs: jest.fn(),
      homepageLink: '/v2/dashboard'
    });

  afterEach(() => {
    PageService.clearTabCloseGuards();
    confirmCalls.length = 0;
    jest.clearAllMocks();
  });

  it('closes a clean tab without asking', () => {
    const instance = makeTabs();

    instance.handleCloseTab(tabs[0]);

    expect(confirmCalls).toHaveLength(0);
    expect(instance.props.deleteTab).toHaveBeenCalledWith(tabs[0]);
  });

  it('asks before closing a tab with unsaved changes and closes only on yes', () => {
    PageService.registerTabCloseGuard(() => true, 'tab-1');
    const instance = makeTabs();

    instance.handleCloseTab(tabs[0]);

    expect(confirmCalls).toHaveLength(1);
    expect(instance.props.deleteTab).not.toHaveBeenCalled();

    confirmCalls[0].onYes();
    expect(instance.props.deleteTab).toHaveBeenCalledWith(tabs[0]);
  });

  it('closes a batch of clean tabs without asking', () => {
    const instance = makeTabs();

    instance.handleCloseTabs(tabs.slice(1), tabs[0]);

    expect(confirmCalls).toHaveLength(0);
    expect(instance.props.closeTabs).toHaveBeenCalledTimes(1);
  });

  it('asks once when any tab of a bulk close holds unsaved changes ("Close other tabs" over a dirty editor)', () => {
    PageService.registerTabCloseGuard(() => true, 'tab-2');
    const instance = makeTabs();

    // Closing "other" tabs from tab-1: the dirty tab-2 is among the closed, not the kept one
    instance.handleCloseTabs(tabs.slice(1), tabs[0]);

    expect(confirmCalls).toHaveLength(1);
    expect(instance.props.closeTabs).not.toHaveBeenCalled();

    confirmCalls[0].onYes();
    expect(instance.props.closeTabs).toHaveBeenCalledTimes(1);
    expect(instance.props.closeTabs.mock.calls[0][0].tabs).toEqual(tabs.slice(1));
  });

  it('"Close all tabs" over a dirty editor asks once, with the data-loss wording', () => {
    PageService.registerTabCloseGuard(() => true, 'tab-2');
    const instance = makeTabs();

    instance.handleCloseAllTabs();

    expect(confirmCalls).toHaveLength(1);
    expect(confirmCalls[0].title).toBe('page-tabs.close-tabs-unsaved-title');
    expect(instance.props.closeTabs).not.toHaveBeenCalled();

    confirmCalls[0].onYes();
    expect(instance.props.closeTabs).toHaveBeenCalledTimes(1);
    // No second confirm stacked after the first
    expect(confirmCalls).toHaveLength(1);
  });

  it('does not ask when the dirty tab is the one being kept', () => {
    PageService.registerTabCloseGuard(() => true, 'tab-1');
    const instance = makeTabs();

    instance.handleCloseTabs(tabs.slice(1), tabs[0]);

    expect(confirmCalls).toHaveLength(0);
    expect(instance.props.closeTabs).toHaveBeenCalledTimes(1);
  });
});
