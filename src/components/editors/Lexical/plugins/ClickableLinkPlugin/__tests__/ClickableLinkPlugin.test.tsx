import { $createLinkNode, LinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { render } from '@testing-library/react';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import React, { useEffect } from 'react';

import ClickableLinkPlugin from '../index';

const EXTERNAL_URL = 'https://external.example.com/v2/journals?journalId=x';
const SAME_ORIGIN_URL = 'http://localhost/v2/dashboard';

function SeedLink({ url }: { url: string }): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode(url);
        link.append($createTextNode(url));
        paragraph.append(link);
        root.append(paragraph);
      },
      // flush to the DOM before the assertions run
      { discrete: true }
    );
  }, [editor, url]);

  return null;
}

function renderReadonlyEditor(url: string) {
  const result = render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        nodes: [LinkNode],
        editable: false,
        onError: (error: Error) => {
          throw error;
        },
        theme: {}
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <ClickableLinkPlugin />
      <SeedLink url={url} />
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

    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(EXTERNAL_URL, '_blank');
  });

  it('does not open a same-origin link — the app router handles it', () => {
    const anchor = renderReadonlyEditor(SAME_ORIGIN_URL);

    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(openSpy).not.toHaveBeenCalled();
  });

  // PageService.parseEvent routes /v2 links from a capture-phase listener on document and calls
  // preventDefault() on the click. The plugin must not open the same link a second time.
  it('does not open a link whose click was already handled by another listener', () => {
    const anchor = renderReadonlyEditor(EXTERNAL_URL);
    const handledByAppRouter = (event: Event) => event.preventDefault();

    document.addEventListener('click', handledByAppRouter, true);

    try {
      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    } finally {
      document.removeEventListener('click', handledByAppRouter, true);
    }

    expect(openSpy).not.toHaveBeenCalled();
  });

  // preventDefault() on mouseup cannot cancel the browser's native middle-click navigation (that
  // default belongs to auxclick), so opening the url here yields two tabs. Leave it to the browser.
  it('leaves middle click to the browser', () => {
    const anchor = renderReadonlyEditor(EXTERNAL_URL);

    anchor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 1 }));
    anchor.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));

    expect(openSpy).not.toHaveBeenCalled();
  });
});
