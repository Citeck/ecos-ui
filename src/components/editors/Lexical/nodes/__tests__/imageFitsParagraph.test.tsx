/* eslint-disable header/header */
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { $createNodeSelection, $createParagraphNode, $getNodeByKey, $getRoot, $setSelection, LexicalEditor, NodeKey } from 'lexical';
import React from 'react';

import { $createImageNode, $isImageNode, ImageNode } from '../ImageNode';

/**
 * An image node carries a `maxWidth` (500px by default). It used to be an inline `max-width` on the
 * <img>, which beats the stylesheet's `max-width: 100%`, so in a narrower editor the picture stuck
 * out of its paragraph and ECOSUI-3474 hid the overrun with `overflow: hidden` on the paragraph —
 * cutting off the selection outline and the resize handles (COREDEV-475).
 *
 * The cap now lives on the wrapper span of the node: `min(<maxWidth>px, 100%)` for a picture nobody
 * has sized and plain `100%` once it carries an explicit width. A percentage on the span resolves
 * against the paragraph, while on the <img> it would be ignored by the inline-block span working out
 * its own width — leaving the span (and the handles) as wide as the natural picture. The <img> itself
 * only fills the span, and no paragraph needs clipping.
 */

// The broken-image placeholder is a raw svg import that jest has no loader for.
jest.mock('../../images/image-broken.svg', () => 'image-broken.svg');
// jsdom has no zoom: lexical's manual fallback multiplies `Number('')` and ends up at 0.
jest.mock('@lexical/utils', () => ({ ...jest.requireActual('@lexical/utils'), calculateZoomLevel: () => 1 }));

const SRC = 'https://example.org/gateway/emodel/content?ref=attachment@1';

let editor: LexicalEditor;

function CaptureEditor(): null {
  [editor] = useLexicalComposerContext();
  return null;
}

/** jsdom never loads images, and ImageComponent suspends until `new Image()` fires onload. */
function stubImageLoading(): void {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  }

  (window as any).Image = FakeImage;
}

async function renderImage(maxWidth?: number, size?: { width: number; height: number }) {
  const { container } = render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        nodes: [ImageNode],
        onError: (error: Error) => {
          throw error;
        },
        theme: {}
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <CaptureEditor />
    </LexicalComposer>
  );

  let key: NodeKey = '';

  await act(async () => {
    editor.update(() => {
      const paragraph = $createParagraphNode();
      const node = $createImageNode({ src: SRC, altText: 'pic.png', maxWidth, ...size });
      key = node.getKey();
      paragraph.append(node);
      $getRoot().clear().append(paragraph);
    });
  });

  const img = await waitFor(() => {
    const el = container.querySelector<HTMLImageElement>('.editor-image img');
    if (!el) {
      throw new Error('image not rendered yet');
    }
    return el;
  });

  return { container, img, key, span: img.closest<HTMLElement>('.editor-image')! };
}

describe('an image never grows past its paragraph (COREDEV-475)', () => {
  // ImageNode loads ImageComponent lazily; its plugin tree is transformed by jest on first use, which
  // took the first test past the timeout every other run. Pay for it once, outside any test.
  beforeAll(() => import('../ImageComponent'), 60000);
  beforeEach(stubImageLoading);

  it('caps an unsized picture at the smaller of the node max width and the paragraph width', async () => {
    const { img, span } = await renderImage();

    expect(span.style.maxWidth).toBe('min(500px, 100%)');
    expect(img.style.maxWidth).toBe('100%');
    expect(img.style.width).toBe('inherit');
  });

  it('keeps a custom max width of the node inside the same cap', async () => {
    const { span } = await renderImage(320);

    expect(span.style.maxWidth).toBe('min(320px, 100%)');
  });

  // The node's maxWidth is only the display size of a picture nobody has sized yet. Once the user
  // has dragged it (ImageResizer lets it grow to the editor's width) that number must not shrink it
  // back; only the paragraph still limits it.
  it('caps an explicitly sized image by the paragraph alone', async () => {
    const { img, span } = await renderImage(500, { width: 900, height: 261 });

    expect(img.style.width).toBe('900px');
    expect(span.style.maxWidth).toBe('100%');
  });

  // A fixed pixel height would survive the paragraph getting narrower while `max-width` shrinks the
  // width, and the picture would squash; the proportion is kept through `aspect-ratio` instead.
  it('keeps the proportions of a sized image through aspect-ratio, not a fixed height', async () => {
    const { img } = await renderImage(500, { width: 900, height: 261 });

    expect(img.style.height).toBe('auto');
    expect(img.style.aspectRatio).toBe('900 / 261');
  });

  it('leaves an unsized image to its natural proportions', async () => {
    const { img } = await renderImage();

    expect(img.style.height).toBe('inherit');
    expect(img.style.aspectRatio).toBeFalsy();
  });

  it('rewrites the cap when the node gets its size after a resize', async () => {
    const { span, key } = await renderImage();

    await act(async () => {
      editor.update(() => {
        const node = $getNodeByKey(key);
        if ($isImageNode(node)) {
          node.setWidthAndHeight(580, 168);
        }
      });
    });

    expect(span.style.maxWidth).toBe('100%');
  });

  // Until the drag ends the node still says `width: 'inherit'`, so its span would keep the 500px cap
  // while the resizer writes `width: 580px` on the <img>: a 500px picture inside a box whose handles
  // follow the pointer.
  it('lifts the cap for the duration of a drag', async () => {
    const { container, key, span } = await renderImage();

    await act(async () => {
      editor.update(() => {
        const selection = $createNodeSelection();
        selection.add(key);
        $setSelection(selection);
      });
    });
    const handle = await waitFor(() => {
      const el = container.querySelector<HTMLElement>('.image-resizer-se');
      if (!el) {
        throw new Error('resizer not shown yet');
      }
      return el;
    });

    await act(async () => {
      fireEvent(handle, new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 500, clientY: 145 }));
    });

    expect(span.style.maxWidth).toBe('100%');

    await act(async () => {
      fireEvent(document, new MouseEvent('pointerup', { bubbles: true, cancelable: true, clientX: 580, clientY: 165 }));
    });
  });
});
