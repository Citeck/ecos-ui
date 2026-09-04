/* eslint-disable header/header */
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $createParagraphNode, $getRoot, createEditor, LexicalEditor, LexicalNode } from 'lexical';

import { $createImageNode, $isImageNode, ImageNode } from '../ImageNode';

/**
 * The formio textarea, MLLexicalEditor, useSyncWithInputHtml and the gantt description serialise
 * the whole editor to HTML on every change (the comment editor used to as well). ImageNode.exportDOM
 * builds a real <img> for that, and a
 * browser starts downloading a picture the moment `src` lands on an <img> — in the page or not. The
 * content service answers `cache-control: no-cache`, so every keystroke re-downloaded every picture
 * of the comment being written (COREDEV-380).
 *
 * `loading="lazy"` set ahead of `src` is the spec's own way to hold that download back: a lazy image
 * only loads once it is in a document and near the viewport, which an element that exists to be
 * serialised never is. Attribute order matters — a `src` set first has already started the load.
 */

const SRC = '/gateway/emodel/api/ecos/webapp/content?ref=attachment%401&att=_content';

function createTestEditor(): LexicalEditor {
  return createEditor({
    namespace: 'test',
    nodes: [ImageNode],
    onError: (error: Error) => {
      throw error;
    }
  });
}

function exportImage(editor: LexicalEditor): string {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createImageNode({ src: SRC, altText: 'pic.png', width: 120, height: 80 }));
      $getRoot().clear().append(paragraph);
    },
    { discrete: true }
  );

  return editor.read(() => $generateHtmlFromNodes(editor, null));
}

const findImage = (nodes: LexicalNode[]): ImageNode | undefined => {
  for (const node of nodes) {
    if ($isImageNode(node)) {
      return node;
    }
    if ('getChildren' in node) {
      const found = findImage((node as any).getChildren());
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

describe('serialising an image node does not download the picture (COREDEV-380)', () => {
  // innerHTML keeps the attributes in the order they were set, so the markup itself shows whether
  // the element was lazy before it got its src
  it('exports the <img> as lazy, with loading ahead of src', () => {
    const html = exportImage(createTestEditor());

    expect(html).toMatch(/<img [^>]*\bloading="lazy"[^>]*\bsrc="/);
  });

  it('exports the src, alt and size as before', () => {
    const html = exportImage(createTestEditor());

    expect(html).toContain(`src="${SRC.replace(/&/g, '&amp;')}"`);
    expect(html).toContain('alt="pic.png"');
    expect(html).toContain('width="120"');
    expect(html).toContain('height="80"');
  });

  it('imports its own markup back into an image node with the same src', () => {
    const editor = createTestEditor();
    const html = exportImage(editor);
    const dom = new DOMParser().parseFromString(html, 'text/html');

    let src: string | undefined;
    // nodes can only be created inside an update
    editor.update(
      () => {
        src = findImage($generateNodesFromDOM(editor, dom))?.getSrc();
      },
      { discrete: true }
    );

    expect(src).toBe(SRC);
  });
});
