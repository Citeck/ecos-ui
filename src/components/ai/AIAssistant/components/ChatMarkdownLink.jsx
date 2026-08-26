import isString from 'lodash/isString';
import React from 'react';

/**
 * Anchor attributes for a link the assistant rendered: a link to another host opens a new browser
 * tab, a link of this host stays a plain anchor. Where a link of this host then goes — a page tab
 * of the app, or a browser tab when it names another workspace — is decided by the tabs router
 * (`PageTabs.handleClickLink`), which claims every `/v2` link of this host from the capture phase
 * of the document. Without `target="_blank"` an external address that the router does not claim
 * (no `/v2` in it) would navigate the whole application away.
 * @param {*} href - The `href` of the anchor, or anything else
 * @returns {{target?: string, rel?: string}}
 */
export const externalLinkProps = href => {
  if (!isString(href) || !href) {
    return {};
  }

  let url;

  try {
    url = new URL(href, window.location.origin);
  } catch (e) {
    return {};
  }

  return url.origin === window.location.origin ? {} : { target: '_blank', rel: 'noopener noreferrer' };
};

/**
 * The anchor every markdown answer of the assistant is rendered with (COREDEV-433). Links of this
 * host are left to the tabs router — the chat panel is portalled into `document.body`, outside
 * `.ecos-modal` and `PageTabs`, so the router sees them like any other link of the page.
 * @param {Object} props - Anchor props as produced by the markdown renderer
 * @param {*} [props.node] - The markdown AST node; consumed here so it never reaches the DOM
 */
const ChatMarkdownLink = ({ node, ...props }) => <a {...props} {...externalLinkProps(props.href)} />;

export default ChatMarkdownLink;
