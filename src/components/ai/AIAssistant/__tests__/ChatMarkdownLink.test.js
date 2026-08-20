import { IGNORE_TABS_HANDLER_ATTR_NAME } from '@citeck/constants/pageTabs';
import { render } from '@testing-library/react';
import React from 'react';

import ChatMarkdownLink, { isJournalSelectionLink } from '../components/ChatMarkdownLink';

import PageService from '@/services/PageService';

const RECORD_LINK = '/v2/dashboard?recordRef=emodel/assignment-type@fb05d827-e586-47eb-a6f2-ff6a510245c1&ws=default';
const OTHER_WORKSPACE_RECORD_LINK = '/v2/dashboard?recordRef=emodel/assignment-type@fb05d827&ws=other-workspace';
const JOURNAL_SELECTION_LINK = '/v2/journals?journalId=emodel/journal@tasks&userConfigId=journal-settings@abc&ws=default';

const renderLink = href => {
  const { container } = render(<ChatMarkdownLink href={href}>link text</ChatMarkdownLink>);
  return container.querySelector('a');
};

/**
 * Clicks the rendered anchor with the very handler PageTabs installs on the document:
 * `ClickOutside type="click"` listens in the capture phase and hands the event to
 * `PageService.parseEvent`. The chat panel is portalled into `document.body`, so — exactly as in
 * the browser — the anchor is neither inside `.ecos-modal` nor inside the PageTabs wrapper.
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
  describe('isJournalSelectionLink', () => {
    it('recognises a journal address carrying a user config id', () => {
      expect(isJournalSelectionLink(JOURNAL_SELECTION_LINK)).toBe(true);
    });

    it('does not treat a plain journal address as a link to selection', () => {
      expect(isJournalSelectionLink('/v2/journals?journalId=emodel/journal@tasks')).toBe(false);
    });

    it('does not treat a record card as a link to selection', () => {
      expect(isJournalSelectionLink(RECORD_LINK)).toBe(false);
    });

    it('reports anything that is not a string as not a link to selection', () => {
      expect(isJournalSelectionLink(undefined)).toBe(false);
      expect(isJournalSelectionLink(null)).toBe(false);
      expect(isJournalSelectionLink(42)).toBe(false);
    });
  });

  describe('rendered anchor', () => {
    it('marks a record link as external so the tabs handler ignores it', () => {
      const anchor = renderLink(RECORD_LINK);

      expect(anchor.getAttribute(IGNORE_TABS_HANDLER_ATTR_NAME)).toBe('true');
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
      expect(anchor.getAttribute('href')).toBe(RECORD_LINK);
    });

    it('marks a record link of another workspace as external too', () => {
      const anchor = renderLink(OTHER_WORKSPACE_RECORD_LINK);

      expect(anchor.getAttribute(IGNORE_TABS_HANDLER_ATTR_NAME)).toBe('true');
      expect(anchor.getAttribute('target')).toBe('_blank');
    });

    it('marks a plain journal link (no user config) as external', () => {
      const anchor = renderLink('/v2/journals?journalId=emodel/journal@tasks');

      expect(anchor.getAttribute(IGNORE_TABS_HANDLER_ATTR_NAME)).toBe('true');
      expect(anchor.getAttribute('target')).toBe('_blank');
    });

    it('leaves the journal link to selection an in-app anchor', () => {
      const anchor = renderLink(JOURNAL_SELECTION_LINK);

      expect(anchor.getAttribute(IGNORE_TABS_HANDLER_ATTR_NAME)).toBeNull();
      expect(anchor.getAttribute('target')).toBeNull();
      expect(anchor.getAttribute('href')).toBe(JOURNAL_SELECTION_LINK);
    });

    it('never leaks the markdown AST node onto the DOM', () => {
      const anchor = renderLink(RECORD_LINK);

      expect(anchor.getAttribute('node')).toBeNull();
    });
  });

  describe('click under the PageTabs capture-phase handler', () => {
    it('lets a record link reach the browser, so target="_blank" opens a real tab', () => {
      const { parsed, prevented } = clickWithPageTabsHandler(RECORD_LINK);

      expect(prevented).toBe(false);
      expect(parsed).toBeUndefined();
    });

    it('lets a record link of another workspace reach the browser', () => {
      const { parsed, prevented } = clickWithPageTabsHandler(OTHER_WORKSPACE_RECORD_LINK);

      expect(prevented).toBe(false);
      expect(parsed).toBeUndefined();
    });

    it('still hands the journal link to selection to the tabs handler', () => {
      const { parsed, prevented } = clickWithPageTabsHandler(JOURNAL_SELECTION_LINK);

      expect(prevented).toBe(true);
      expect(parsed).toEqual(expect.objectContaining({ link: JOURNAL_SELECTION_LINK }));
    });
  });
});
