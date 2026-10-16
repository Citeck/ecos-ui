import { $createLinkNode, LinkNode } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { fireEvent, render } from '@testing-library/react';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import React, { useEffect } from 'react';

import FloatingLinkEditorPlugin from '../../FloatingLinkEditorPlugin';
import ClickableLinkPlugin from '../index';

import PageService from '@/services/PageService';

const EXTERNAL_URL = 'https://external.example.com/v2/journals?journalId=x';
const SAME_ORIGIN_URL = 'http://localhost/v2/dashboard';

function SeedLink({ url, selectLink = false }: { url: string; selectLink?: boolean }): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode(url);
        const text = $createTextNode(url);
        link.append(text);
        paragraph.append(link);
        root.append(paragraph);
        if (selectLink) text.select(0, 0);
      },
      // flush to the DOM before the assertions run
      { discrete: true }
    );
  }, [editor, url, selectLink]);

  return null;
}

function renderReadonlyEditor(url: string, editable = false) {
  const result = render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        nodes: [LinkNode],
        editable,
        onError: (error: Error) => {
          throw error;
        },
        theme: {}
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <ClickableLinkPlugin />
      {editable && <FloatingLinkEditorPlugin isLinkEditMode={false} setIsLinkEditMode={() => {}} />}
      <SeedLink url={url} selectLink={editable} />
    </LexicalComposer>
  );

  const anchor = result.container.querySelector('a[href]') as HTMLAnchorElement;

  expect(anchor).not.toBeNull();

  return anchor;
}

describe('ClickableLinkPlugin', () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens an external link once on a plain left click', () => {
    const anchor = renderReadonlyEditor(EXTERNAL_URL);

    fireEvent(anchor, new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(EXTERNAL_URL, '_blank');
  });

  it('does not open a same-origin link — the app router handles it', () => {
    const anchor = renderReadonlyEditor(SAME_ORIGIN_URL);

    fireEvent(anchor, new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(openSpy).not.toHaveBeenCalled();
  });

  // PageService.parseEvent routes /v2 links from a capture-phase listener on document and calls
  // preventDefault() on the click. The plugin must not open the same link a second time.
  it('does not open a link whose click was already handled by another listener', () => {
    const anchor = renderReadonlyEditor(EXTERNAL_URL);
    const handledByAppRouter = (event: Event) => event.preventDefault();

    document.addEventListener('click', handledByAppRouter, true);

    try {
      fireEvent(anchor, new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    } finally {
      document.removeEventListener('click', handledByAppRouter, true);
    }

    expect(openSpy).not.toHaveBeenCalled();
  });

  it.each([EXTERNAL_URL, SAME_ORIGIN_URL])('keeps a plain click in an editable link for caret placement: %s', url => {
    const anchor = renderReadonlyEditor(url, true);
    const route = jest.fn(event => PageService.parseEvent({ event }));
    document.addEventListener('click', route, true);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    try {
      fireEvent(anchor, event);
    } finally {
      document.removeEventListener('click', route, true);
    }
    expect(event.defaultPrevented).toBe(true);
    expect(route).toHaveReturnedWith(undefined);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it.each([EXTERNAL_URL, SAME_ORIGIN_URL])('opens an editable link once on Ctrl+click: %s', url => {
    const anchor = renderReadonlyEditor(url, true);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    const route = (event: Event) => PageService.parseEvent({ event });
    document.addEventListener('click', route, true);
    try {
      fireEvent(anchor, event);
    } finally {
      document.removeEventListener('click', route, true);
    }
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(url, '_blank');
    expect(event.defaultPrevented).toBe(true);
  });

  // preventDefault() on mouseup cannot cancel the browser's native middle-click navigation (that
  // default belongs to auxclick), so opening the url here yields two tabs. Leave it to the browser.
  it('leaves middle click to the browser', () => {
    const anchor = renderReadonlyEditor(EXTERNAL_URL);

    fireEvent(anchor, new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 1 }));
    fireEvent(anchor, new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));

    expect(openSpy).not.toHaveBeenCalled();
  });
});
