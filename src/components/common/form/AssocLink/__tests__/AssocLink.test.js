import { fireEvent, render } from '@testing-library/react';
import React from 'react';

jest.mock('@/services/PageService', () => ({
  __esModule: true,
  default: { changeUrlLink: jest.fn() }
}));

jest.mock('@/services/pageTabs/PageTabList', () => ({
  __esModule: true,
  default: { setLastActiveTabWs: jest.fn() }
}));

jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  getWorkspaceId: () => 'default'
}));

import PageService from '@/services/PageService';
import PageTabList from '@/services/pageTabs/PageTabList';

import { AssocLink } from '../index';

const LINK = '/v2/dashboard?recordRef=emodel/thing@1';

describe('AssocLink', () => {
  beforeEach(() => {
    PageService.changeUrlLink.mockClear();
  });

  // COREDEV-435: the click target is what carries the modifier, and only the modifier lets the
  // stylesheet shrink the box onto the name. Without it the value keeps the control's full width
  // and the blank space beside a short name opens a record the user never pointed at.
  it('marks a clickable value as a link so its box can be shrunk onto the name', () => {
    const { container } = render(<AssocLink label="A" link={LINK} />);

    const value = container.querySelector('.assoc-value');

    expect(value).not.toBeNull();
    expect(value.classList.contains('assoc-value_link')).toBe(true);
  });

  it('marks the anchor fallback as a link too', () => {
    const { container } = render(<AssocLink label="A" />);

    const value = container.querySelector('a.assoc-value');

    expect(value).not.toBeNull();
    expect(value.classList.contains('assoc-value_link')).toBe(true);
  });

  // A value rendered as plain text opens nothing, so it must not be narrowed to its own text:
  // it stays the control-wide label it has always been.
  it('leaves a plain-text value unmarked', () => {
    const { container } = render(<AssocLink label="A" asText />);

    const value = container.querySelector('.assoc-value');

    expect(value).not.toBeNull();
    expect(value.classList.contains('assoc-value_link')).toBe(false);
  });

  it('keeps the caller-supplied class next to the link modifier', () => {
    const { container } = render(<AssocLink label="A" link={LINK} className="select-journal-view-mode__list-value" />);

    const value = container.querySelector('.assoc-value');

    expect(value.classList.contains('assoc-value_link')).toBe(true);
    expect(value.classList.contains('select-journal-view-mode__list-value')).toBe(true);
  });

  it('still opens the record when the name itself is clicked', () => {
    const { container } = render(<AssocLink label="A" link={LINK} />);

    fireEvent.click(container.querySelector('.assoc-value'));

    expect(PageService.changeUrlLink).toHaveBeenCalledWith(LINK, expect.objectContaining({ openNewTab: true }));
  });

  it('still hands a middle click to a new browser tab', () => {
    const { container } = render(<AssocLink label="A" link={LINK} paramsLink={{ workspaceId: 'TEST2' }} />);

    fireEvent.mouseDown(container.querySelector('.assoc-value'), { button: 1 });

    expect(PageService.changeUrlLink).toHaveBeenCalledWith('/v2/dashboard?ws=TEST2&recordRef=emodel/thing@1', { openNewBrowserTab: true });
  });
});

// A physical primary click dispatches all three events, not click alone.
describe('AssocLink physical gestures', () => {
  beforeEach(() => jest.clearAllMocks());

  const gesture = (target, options = {}) => {
    fireEvent.mouseDown(target, { button: 0, ...options });
    fireEvent.mouseUp(target, { button: 0, ...options });
    fireEvent.click(target, { button: 0, ...options });
  };

  describe.each([undefined, 'default', 'OTHER'])('workspace=%s', workspaceId => {
    it.each([undefined, false, true])('primary click navigates once with policy=%s', openNewBrowserTab => {
      const { getByText } = render(<AssocLink label="Selected" link={LINK} paramsLink={{ openNewBrowserTab, workspaceId }} />);
      gesture(getByText('Selected'));
      expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
      const [url, params] = PageService.changeUrlLink.mock.calls[0];
      const parsed = new URL(url, window.location.origin);
      expect(parsed.searchParams.get('recordRef')).toBe('emodel/thing@1');
      expect(parsed.searchParams.get('ws')).toBe(workspaceId || null);
      if (openNewBrowserTab) {
        expect(params.openNewBrowserTab).toBe(true);
      } else {
        expect(params).toEqual(expect.objectContaining({ openNewTab: true, reopen: true, closeActiveTab: false }));
        expect(params.openNewBrowserTab).toBeFalsy();
        if (workspaceId) expect(params.needUpdateTabs).toBe(workspaceId !== 'default');
      }
      expect(PageTabList.setLastActiveTabWs).toHaveBeenCalledTimes(workspaceId && workspaceId !== 'default' ? 1 : 0);
    });

    it.each([{ ctrlKey: true }, { metaKey: true }, { button: 1 }])('browser gesture %j overrides false exactly once', options => {
      const { getByText } = render(<AssocLink label="Selected" link={LINK} paramsLink={{ openNewBrowserTab: false, workspaceId }} />);
      gesture(getByText('Selected'), options);
      expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
      const [url, params] = PageService.changeUrlLink.mock.calls[0];
      expect(new URL(url, window.location.origin).searchParams.get('ws')).toBe(workspaceId || null);
      expect(params.openNewBrowserTab).toBe(true);
    });

    it('ignores right-click', () => {
      const { getByText } = render(<AssocLink label="Selected" link={LINK} paramsLink={{ workspaceId }} />);
      gesture(getByText('Selected'), { button: 2 });
      expect(PageService.changeUrlLink).not.toHaveBeenCalled();
    });
  });

  it('does not navigate as text, even with a link and browser policy', () => {
    const { getByText } = render(<AssocLink label="Selected" link={LINK} asText paramsLink={{ openNewBrowserTab: true }} />);
    gesture(getByText('Selected'));
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it('preserves caller navigation parameters without a workspace', () => {
    const { getByText } = render(<AssocLink label="Selected" link={LINK} paramsLink={{ reopen: false, closeActiveTab: true }} />);
    gesture(getByText('Selected'));
    expect(PageService.changeUrlLink).toHaveBeenCalledWith(LINK, expect.objectContaining({ reopen: false, closeActiveTab: true }));
  });
});
