# Link navigation while editing comments (COREDEV-637)

In an editable Lexical comment, a normal click places the caret and dragging selects link text. Ctrl+click (Cmd+click on macOS) deliberately opens the clicked link in a browser tab and keeps the draft mounted. This applies to both internal and external links. Saved, read-only comments retain the existing navigation policy, including the protections against duplicate tabs described in `comment-link-opens-two-tabs.md`.

Two event layers must cooperate:

- `PageService.parseEvent` runs from a document capture listener before Lexical. It cancels unmodified link navigation inside editable content, before applying modal or page-tab routing. The nearest explicit `contenteditable` attribute determines the boundary, so a read-only island remains read-only.
- `ClickableLinkPlugin` checks the nearest editor's current editability. It blocks ordinary link activation while editing and owns intentional Ctrl/Cmd navigation, including same-origin links that browsers do not reliably follow inside `contenteditable`. It respects already-prevented clicks and uses the clicked node's sanitized URL.
- `FloatingLinkEditorPlugin` updates its toolbar on clicks but does not open links. A second navigation handler here would duplicate Ctrl/Cmd navigation or open the link from an old selection.

Regression tests cover editable and read-only links with real Lexical plugins and document capture routing, plus PageTabs integration. Browser verification uses an existing comment with internal and external links: place the caret, select part of a link using a mouse drag, replace its text, open each link once with Ctrl, and save the modified comment.
