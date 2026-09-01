import { render } from '@testing-library/react';
import React from 'react';

import ChatMarkdownLink, { externalLinkProps } from '../components/ChatMarkdownLink';

import PageService from '@/services/PageService';

const HOST = window.location.origin; // http://localhost in jsdom
const RECORD_LINK = '/v2/dashboard?recordRef=emodel/assignment-type@fb05d827-e586-47eb-a6f2-ff6a510245c1&ws=default';
const OTHER_WORKSPACE_RECORD_LINK = '/v2/dashboard?recordRef=emodel/assignment-type@fb05d827&ws=other-workspace';
const JOURNAL_SELECTION_LINK = '/v2/journals?journalId=emodel/journal@tasks&userConfigId=journal-settings@abc&ws=default';
const OTHER_HOST_LINK = 'https://other.example.com/v2/dashboard?recordRef=emodel/type@a&ws=default';
const PLAIN_EXTERNAL_LINK = 'https://example.com/docs/page';

const renderLink = href => {
  const { container } = render(<ChatMarkdownLink href={href}>link text</ChatMarkdownLink>);
  return container.querySelector('a');
};

/**
 * Clicks the rendered anchor with the very handler PageTabs installs on the document:
 * `ClickOutside type="click"` listens in the capture phase and hands the event to
 * `PageService.parseEvent`. Where the click then goes (page tab vs browser tab) is decided by
 * `PageTabs.handleClickLink` — see PageTabs.linkPolicy.test.js. Here the anchor only has to reach
 * that router for links of this host and stay out of its way for the others.
 */
const clickWithPageTabsHandler = href => {
  const anchor = renderLink(href);
  let parsed;
  const listener = event => {
    parsed = PageService.parseEvent({ event });
  };

  document.addEventListener('click', listener, true);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  anchor.dispatchEvent(event);
  document.removeEventListener('click', listener, true);

  return { anchor, parsed, prevented: event.defaultPrevented };
};

describe('ChatMarkdownLink', () => {
  describe('externalLinkProps', () => {
    it('is empty for links of this host, relative or absolute', () => {
      expect(externalLinkProps(RECORD_LINK)).toEqual({});
      expect(externalLinkProps(`${HOST}${RECORD_LINK}`)).toEqual({});
      expect(externalLinkProps(OTHER_WORKSPACE_RECORD_LINK)).toEqual({});
    });

    it('sends a link to another host to a new browser tab', () => {
      expect(externalLinkProps(OTHER_HOST_LINK)).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
      expect(externalLinkProps(PLAIN_EXTERNAL_LINK)).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
    });

    it('treats anything that is not a usable address as a link of this host', () => {
      expect(externalLinkProps(undefined)).toEqual({});
      expect(externalLinkProps('')).toEqual({});
      expect(externalLinkProps(42)).toEqual({});
    });
  });

  describe('rendered anchor', () => {
    it.each([
      ['a record of the current workspace', RECORD_LINK],
      ['a record of another workspace', OTHER_WORKSPACE_RECORD_LINK],
      ['a journal link to selection', JOURNAL_SELECTION_LINK]
    ])('%s is a plain in-app anchor the tabs router decides about', (_, href) => {
      const anchor = renderLink(href);

      expect(anchor.getAttribute('href')).toBe(href);
      expect(anchor.getAttribute('target')).toBeNull();
      expect(anchor.getAttribute('data-external')).toBeNull();
    });

    it('a link to another host opens a new browser tab', () => {
      const anchor = renderLink(OTHER_HOST_LINK);

      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('never leaks the markdown AST node onto the DOM', () => {
      const anchor = renderLink(RECORD_LINK);

      expect(anchor.getAttribute('node')).toBeNull();
    });
  });

  describe('click under the PageTabs capture-phase handler', () => {
    it('hands a record link of this host to the tabs router', () => {
      const { parsed, prevented } = clickWithPageTabsHandler(RECORD_LINK);

      expect(prevented).toBe(true);
      expect(parsed).toEqual(expect.objectContaining({ link: RECORD_LINK }));
    });

    it('hands a record link of another workspace to the tabs router (which opens a browser tab)', () => {
      const { parsed, prevented } = clickWithPageTabsHandler(OTHER_WORKSPACE_RECORD_LINK);

      expect(prevented).toBe(true);
      expect(parsed).toEqual(expect.objectContaining({ link: OTHER_WORKSPACE_RECORD_LINK }));
    });

    it('lets a plain external link reach the browser', () => {
      const { parsed, prevented } = clickWithPageTabsHandler(PLAIN_EXTERNAL_LINK);

      expect(prevented).toBe(false);
      expect(parsed).toBeUndefined();
    });
  });
});
