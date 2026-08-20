import { IGNORE_TABS_HANDLER_ATTR_NAME } from '@citeck/constants/pageTabs';
import React from 'react';

/**
 * A "link to selection" the assistant answers with: a journal address carrying the id of a saved
 * user config. Recognised by both parts — a bare `/v2/journals?...` link is an ordinary journal
 * link and must behave like every other link of the answer.
 * @param {*} href - The `href` of the rendered anchor, or anything else
 * @returns {boolean}
 */
export const isJournalSelectionLink = href => typeof href === 'string' && /\/v2\/journals\?/.test(href) && href.includes('userConfigId');

/**
 * The anchor every markdown answer of the assistant is rendered with.
 *
 * The chat panel is portalled straight into `document.body` (`AIAssistantContainer`), so it sits
 * neither inside `.ecos-modal` nor inside `PageTabs` — the two places `PageService.parseEvent`
 * treats as "not mine". The capture-phase listener `PageTabs` puts on the document
 * (`ClickOutside type="click"`) therefore claims every `/v2` link of an answer and calls
 * `preventDefault()` on it; `target="_blank"` never fires and the address is pushed client-side
 * instead. When the link names a workspace other than the current one, that push changes the
 * address before the tab is registered and `Dashboard` — which renders nothing until its `tabId`
 * is the active tab — mounts with an empty config: the blank page of COREDEV-433. Opening the same
 * address in a new browser window boots the whole application and has no such race, which is why
 * only the in-app transition was broken.
 *
 * `data-external` (`IGNORE_TABS_HANDLER_ATTR_NAME`) is the documented way to tell that listener to
 * keep its hands off a link, and it is what makes the `target="_blank"` the assistant already asked
 * for actually happen.
 *
 * The journal "link to selection" is the one link that *wants* to be intercepted: rendered as a
 * plain in-app anchor it lets `PageTabs` reuse the journal tab already open and push the new
 * address into it, and the journal view then re-applies the user config on the `userConfigId`
 * change. Sent to a new browser tab it would open a second journal instead.
 * @param {Object} props - Anchor props as produced by the markdown renderer
 * @param {*} [props.node] - The markdown AST node; consumed here so it never reaches the DOM
 */
const ChatMarkdownLink = ({ node, ...props }) => {
  if (isJournalSelectionLink(props.href || '')) {
    return <a {...props} />;
  }

  return <a {...props} target="_blank" rel="noopener noreferrer" {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }} />;
};

export default ChatMarkdownLink;
