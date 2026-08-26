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

  it('a link that names no workspace opens a page tab of the app, as before', () => {
    const instance = makeTabs();

    click(instance, '/v2/dashboard?recordRef=emodel/type@a');

    expect(instance.props.setTab).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('a link into another workspace opens a browser tab', () => {
    const instance = makeTabs();

    const event = click(instance, '/v2/dashboard?recordRef=emodel/type@a&ws=OTHER');

    expect(event.defaultPrevented).toBe(true);
    expect(openSpy).toHaveBeenCalledWith('/v2/dashboard?recordRef=emodel/type@a&ws=OTHER', '_blank');
    expect(instance.props.setTab).not.toHaveBeenCalled();
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
