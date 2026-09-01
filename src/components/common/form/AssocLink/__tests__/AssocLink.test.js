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
  getLinkWithWs: link => link,
  getWorkspaceId: () => 'default'
}));

import PageService from '@/services/PageService';

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

    expect(PageService.changeUrlLink).toHaveBeenCalledWith(LINK, { openNewBrowserTab: true });
  });
});
