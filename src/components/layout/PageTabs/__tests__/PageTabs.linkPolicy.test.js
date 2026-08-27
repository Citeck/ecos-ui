jest.mock('@/components/common/dialogs/Manager', () => ({ __esModule: true, default: { confirmDialog: jest.fn() } }));
jest.mock('@/services/userLocalSettings', () => ({ __esModule: true, default: { removeDataOnTab: jest.fn() } }));
jest.mock('@/helpers/urls', () => ({ ...jest.requireActual('@/helpers/urls'), getWorkspaceId: jest.fn(() => 'TEST2') }));
jest.mock('@/helpers/util', () => ({ ...jest.requireActual('@/helpers/util'), getEnabledWorkspaces: jest.fn(() => true) }));

import { PageTabs } from '../PageTabs';

/**
 * Where a left click on a `/v2` link goes (COREDEV-433). `PageTabs` routes every such click from
 * the capture phase of the document: a page tab of the app for the workspace the user is in, a
 * browser tab as soon as the link leaves the current host or the current workspace — the latter
 * is the transition that used to be pushed client-side and left a blank dashboard.
 */
describe('PageTabs.handleClickLink — where a link opens', () => {
  const HOST = window.location.origin; // http://localhost in jsdom
  let openSpy;
  let anchor;

  const makeTabs = () => new PageTabs({ isShow: true, tabs: [], setTab: jest.fn(), updateTabs: jest.fn(), homepageLink: '/v2/dashboard' });

  const click = (instance, href, init = {}) => {
    anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = 'link';
    document.body.appendChild(anchor);

    const listener = event => instance.handleClickLink(event);
    document.addEventListener('click', listener, true);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    anchor.dispatchEvent(event);
    document.removeEventListener('click', listener, true);

    return event;
  };

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => ({ focus: jest.fn() }));
  });

  afterEach(() => {
    anchor && anchor.remove();
    jest.restoreAllMocks();
  });

  it('a link into the current workspace opens a page tab of the app', () => {
    const instance = makeTabs();

    const event = click(instance, '/v2/dashboard?recordRef=emodel/type@a&ws=TEST2');

    expect(event.defaultPrevented).toBe(true);
    expect(instance.props.setTab).toHaveBeenCalledTimes(1);
    expect(instance.props.setTab.mock.calls[0][0].data.link).toBe('/v2/dashboard?recordRef=emodel/type@a&ws=TEST2');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('a link without a host counts as a link of this host', () => {
    const instance = makeTabs();

    click(instance, '/v2/journals?journalId=tasks&ws=TEST2');

    expect(instance.props.setTab).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('a link that names no workspace opens a page tab of the app, as before', () => {
    const instance = makeTabs();

    click(instance, '/v2/dashboard?recordRef=emodel/type@a');

    expect(instance.props.setTab).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('a link into another workspace opens a browser tab', () => {
    const instance = makeTabs();

    const event = click(instance, '/v2/journals?journalId=tasks&ws=OTHER');

    expect(event.defaultPrevented).toBe(true);
    expect(openSpy).toHaveBeenCalledWith('/v2/journals?journalId=tasks&ws=OTHER', '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
  });

  it('the dashboard of another workspace itself opens a browser tab', () => {
    const instance = makeTabs();

    click(instance, '/v2/dashboard?ws=OTHER');

    expect(openSpy).toHaveBeenCalledWith('/v2/dashboard?ws=OTHER', '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
  });

  // A record card of another workspace is no exception (iteration 3): the dashboard of a record is
  // resolved for the workspace the card is shown in, so a card shown inside the current workspace
  // came up with the wrong dashboard. The link keeps its own `ws` and boots in a browser tab.
  it('a record card of another workspace opens a browser tab with the workspace the link names', () => {
    const instance = makeTabs();

    const event = click(instance, '/v2/dashboard?recordRef=emodel/type@a&ws=OTHER');

    expect(event.defaultPrevented).toBe(true);
    expect(openSpy).toHaveBeenCalledWith('/v2/dashboard?recordRef=emodel/type@a&ws=OTHER', '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
  });

  it('an absolute link of this host to a record card of another workspace opens a browser tab too', () => {
    const instance = makeTabs();

    click(instance, `${HOST}/v2/dashboard?recordRef=emodel/type@a&ws=OTHER`);

    expect(openSpy).toHaveBeenCalledWith(`${HOST}/v2/dashboard?recordRef=emodel/type@a&ws=OTHER`, '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
  });

  // Ctrl (Cmd on macOS) and Shift are the browser's own "new tab" / "new window" modifiers. The
  // click is not claimed at all — no preventDefault, no page tab, no window.open of our own (that
  // would give two tabs) — so the browser opens the link as is, `ws` included.
  it.each([['ctrlKey'], ['metaKey'], ['shiftKey']])('a click with %s pressed is left to the browser, whatever the link', modifier => {
    const instance = makeTabs();

    const sameWs = click(instance, '/v2/dashboard?recordRef=emodel/type@a&ws=TEST2', { [modifier]: true });
    const otherWs = click(instance, '/v2/dashboard?recordRef=emodel/type@a&ws=OTHER', { [modifier]: true });
    const noWs = click(instance, '/v2/journals?journalId=tasks', { [modifier]: true });

    expect(sameWs.defaultPrevented).toBe(false);
    expect(otherWs.defaultPrevented).toBe(false);
    expect(noWs.defaultPrevented).toBe(false);
    expect(instance.props.setTab).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('a link marked to open in the background still opens a background page tab on a plain click', () => {
    const instance = makeTabs();
    const holder = document.createElement('div');
    holder.innerHTML = '<a href="/v2/journals?journalId=tasks&ws=TEST2" data-open-in-background="true">link</a>';
    document.body.appendChild(holder);

    const listener = event => instance.handleClickLink(event);
    document.addEventListener('click', listener, true);
    holder.firstChild.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    document.removeEventListener('click', listener, true);
    holder.remove();

    expect(instance.props.setTab).toHaveBeenCalledTimes(1);
    expect(instance.props.setTab.mock.calls[0][0].data.isActive).toBe(false);
  });

  it('an absolute link of this host into another workspace opens a browser tab too', () => {
    const instance = makeTabs();

    click(instance, `${HOST}/v2/journals?journalId=tasks&ws=OTHER`);

    expect(openSpy).toHaveBeenCalledWith(`${HOST}/v2/journals?journalId=tasks&ws=OTHER`, '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
  });

  it('a link to another host opens a browser tab, as before', () => {
    const instance = makeTabs();

    click(instance, 'https://other.example.com/v2/dashboard?recordRef=emodel/type@a&ws=TEST2');

    expect(openSpy).toHaveBeenCalledWith('https://other.example.com/v2/dashboard?recordRef=emodel/type@a&ws=TEST2', '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
  });
});
