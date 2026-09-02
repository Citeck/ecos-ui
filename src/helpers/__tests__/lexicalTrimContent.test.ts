import { $createCodeHighlightNode, $createCodeNode } from '@lexical/code';
import { $createLinkNode } from '@lexical/link';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createTableCellNode, $createTableNode, $createTableRowNode } from '@lexical/table';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  ElementNode,
  LexicalNode,
  createEditor
} from 'lexical';

import { $createFileNode } from '@/components/editors/Lexical/nodes/FileNode/utils';
import { $createImageNode } from '@/components/editors/Lexical/nodes/ImageNode';
import PlaygroundNodes from '@/components/editors/Lexical/nodes/PlaygroundNodes';
import { $trimEditorContent } from '@/helpers/lexical';

// Empty lines pressed before or after the text are not part of the comment — they only push it
// around in the feed. Trimming them off is the job of the document, not of the html: an attached
// file or a picture is a decorator with no text at all, and must survive a trim untouched. The
// same goes for every block that is not plain text — a table, a list, a code block: what the
// reader sees on the screen may not change, so the trim cuts total emptiness and nothing else.

const paragraph = (...children: LexicalNode[]): ElementNode => {
  const node = $createParagraphNode();
  node.append(...children);

  return node;
};

const heading = (...children: LexicalNode[]): ElementNode => {
  const node = $createHeadingNode('h2');
  node.append(...children);

  return node;
};

// one row, one cell, holding the given blocks — an empty paragraph makes it the table Lexical
// inserts from the toolbar before anything is typed into it
const table = (...cellBlocks: ElementNode[]): ElementNode => {
  const cell = $createTableCellNode(0);
  cell.append(...cellBlocks);
  const row = $createTableRowNode();
  row.append(cell);
  const node = $createTableNode();
  node.append(row);

  return node;
};

const trimmed = (build: () => LexicalNode[], probe: () => string = () => '') => {
  const editor = createEditor({
    nodes: PlaygroundNodes,
    onError: e => {
      throw e;
    }
  });

  let result = { blocks: [] as string[], text: '', probed: '' };

  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      root.append(...build());

      $trimEditorContent();

      result = { blocks: root.getChildren().map(node => node.getType()), text: root.getTextContent(), probed: probe() };
    },
    { discrete: true }
  );

  return result;
};

const file = () => $createFileNode({ size: 10, name: 'clip.mp4', fileRecordId: 'emodel/attachment@abc' });
const picture = () => $createImageNode({ src: '/gateway/emodel/api/ecos/webapp/content?ref=attachment@abc', altText: 'pic.png' });

describe('$trimEditorContent', () => {
  it('drops blank paragraphs before and after the text', () => {
    const { blocks, text } = trimmed(() => [paragraph(), paragraph($createTextNode('text')), paragraph(), paragraph()]);

    expect(blocks).toEqual(['paragraph']);
    expect(text).toBe('text');
  });

  it('keeps blank paragraphs inside the text', () => {
    const { blocks } = trimmed(() => [paragraph($createTextNode('a')), paragraph(), paragraph($createTextNode('b'))]);

    expect(blocks).toEqual(['paragraph', 'paragraph', 'paragraph']);
  });

  it('trims the spaces around the text itself', () => {
    expect(trimmed(() => [paragraph($createTextNode('  text  '))]).text).toBe('text');
  });

  it('drops line breaks at both ends', () => {
    const { text } = trimmed(() => [
      paragraph($createLineBreakNode(), $createTextNode('text'), $createLineBreakNode(), $createLineBreakNode())
    ]);

    expect(text).toBe('text');
  });

  it('keeps a line break inside the text', () => {
    expect(trimmed(() => [paragraph($createTextNode('a'), $createLineBreakNode(), $createTextNode('b'))]).text).toBe('a\nb');
  });

  it('walks past a paragraph that trimming has emptied', () => {
    const { blocks, text } = trimmed(() => [paragraph($createTextNode('   ')), paragraph($createTextNode('text'))]);

    expect(blocks).toEqual(['paragraph']);
    expect(text).toBe('text');
  });

  it('keeps an attached file that is all the comment has', () => {
    const { blocks } = trimmed(() => [paragraph(), paragraph(file()), paragraph()]);

    expect(blocks).toEqual(['paragraph']);
    expect(trimmed(() => [paragraph(file())]).blocks).toEqual(['paragraph']);
  });

  it('keeps a picture at the very end of the comment', () => {
    const { blocks } = trimmed(() => [paragraph($createTextNode('look: ')), paragraph(picture()), paragraph()]);

    expect(blocks).toEqual(['paragraph', 'paragraph']);
  });

  it('treats a heading like a paragraph: a blank one goes, the spaces around its text are cut', () => {
    const { blocks, text } = trimmed(() => [
      heading(),
      heading($createTextNode('  Title')),
      paragraph($createTextNode('text')),
      heading($createTextNode('end  ')),
      heading()
    ]);

    expect(blocks).toEqual(['heading', 'paragraph', 'heading']);
    expect(text).toBe('Title\n\ntext\n\nend');
  });

  it('keeps the indentation of a code block that opens the comment', () => {
    const code = () => {
      const node = $createCodeNode();
      node.append($createCodeHighlightNode('    indented();'));

      return node;
    };

    const { blocks, text } = trimmed(() => [code(), paragraph($createTextNode('after'))]);

    expect(blocks).toEqual(['code', 'paragraph']);
    expect(text).toBe('    indented();\n\nafter');
  });

  it('leaves the leading spaces of a list that opens the comment', () => {
    const list = () => {
      const item = $createListItemNode();
      item.append($createTextNode('  item'));
      const node = $createListNode('bullet');
      node.append(item);

      return node;
    };

    const { blocks, text } = trimmed(() => [list(), paragraph($createTextNode('text'))]);

    expect(blocks).toEqual(['list', 'paragraph']);
    expect(text).toBe('  item\n\ntext');
  });

  it('keeps an empty table at the end — it is on the screen — while the blank line after it still goes', () => {
    const { blocks } = trimmed(() => [paragraph($createTextNode('text')), table(paragraph()), paragraph()]);

    expect(blocks).toEqual(['paragraph', 'table']);
  });

  it('does not reach into the last cell of a table that closes the comment', () => {
    let cellText: ElementNode;

    const { blocks, probed } = trimmed(
      () => {
        cellText = paragraph($createTextNode('cell  '), $createLineBreakNode());

        return [paragraph($createTextNode('text')), table(cellText)];
      },
      () => cellText.getTextContent()
    );

    expect(blocks).toEqual(['paragraph', 'table']);
    expect(probed).toBe('cell  \n');
  });

  it('a whitespace-only link at the end goes with its paragraph and leaves no empty link behind', () => {
    const link = () => {
      const node = $createLinkNode('https://example.com');
      node.append($createTextNode('   '));

      return node;
    };

    const { blocks, text } = trimmed(() => [paragraph($createTextNode('text')), paragraph(link())]);

    expect(blocks).toEqual(['paragraph']);
    expect(text).toBe('text');
  });

  it('leaves the caret inside what is left — a stale offset makes Lexical throw', () => {
    const editor = createEditor({
      nodes: PlaygroundNodes,
      onError: e => {
        throw e;
      }
    });

    let anchor = { offset: 0, size: 0 };

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const text = $createTextNode('   text   ');
        root.append(paragraph(text));
        // the caret sits at the end of the line the author was typing on
        text.select(10, 10);

        $trimEditorContent();

        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          anchor = { offset: selection.anchor.offset, size: selection.anchor.getNode().getTextContentSize() };
        }
      },
      { discrete: true }
    );

    expect(anchor.offset).toBeLessThanOrEqual(anchor.size);
  });

  it('leaves an empty document alone', () => {
    const { blocks, text } = trimmed(() => [paragraph()]);

    expect(blocks).toEqual(['paragraph']);
    expect(text).toBe('');
  });
});
