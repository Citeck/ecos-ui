import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';

import PlaygroundNodes from '@/components/editors/Lexical/nodes/PlaygroundNodes';

import { Comment } from '../Comment';

// The text that goes to the server is generated from the live document right before the save,
// after the edges have been trimmed — not from the html/raw the editor last reported through
// onChange. Both storage formats must come out of the same trimmed content.

const newEditor = () =>
  createEditor({
    nodes: PlaygroundNodes,
    onError: e => {
      throw e;
    }
  });

const paragraph = (...children) => {
  const node = $createParagraphNode();
  node.append(...children);

  return node;
};

const fill = (editor, build) => {
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      root.append(...build());
    },
    { discrete: true }
  );
};

const padded = () => [paragraph(), paragraph($createTextNode('  text  '), $createLineBreakNode()), paragraph()];

const commentWith = (dataStorageFormat, editor) => {
  const comment = new Comment({ dataStorageFormat });
  comment._editor = editor;

  return comment;
};

describe('Comment — what is sent on save', () => {
  it.each(['html', 'plain-text', undefined])('storage format %s: the html is generated from the trimmed document', dataStorageFormat => {
    const editor = newEditor();
    fill(editor, padded);

    const text = commentWith(dataStorageFormat, editor).handleTextBeforeSave();

    expect(text.match(/<p/g)).toHaveLength(1);
    expect(text).toContain('>text<');
    expect(text).not.toContain('<br');
  });

  it('storage format raw: the editor state is serialised after the trim', () => {
    const editor = newEditor();
    fill(editor, padded);

    const raw = JSON.parse(commentWith('raw', editor).handleTextBeforeSave());

    expect(raw.root.children).toHaveLength(1);
    expect(raw.root.children[0].children.map(child => child.text)).toEqual(['text']);
  });

  it('falls back to the last reported content when no editor has announced itself', () => {
    const comment = commentWith('html', undefined);
    comment.state = { ...comment.state, htmlComment: '<p>reported</p>', rawComment: '{"root":{}}' };

    expect(comment.handleTextBeforeSave()).toBe('<p>reported</p>');
    expect(commentWith('raw', undefined).handleTextBeforeSave()).toBeUndefined();
  });

  it('the trim does not become an undo step of its own', () => {
    const editor = newEditor();
    const historyState = createEmptyHistoryState();
    registerHistory(editor, historyState, 0);
    fill(editor, () => [paragraph($createTextNode('first'))]);
    fill(editor, padded);
    const stackBefore = historyState.undoStack.length;

    commentWith('html', editor).handleTextBeforeSave();

    expect(historyState.undoStack).toHaveLength(stackBefore);
    expect(historyState.current.editorState.read(() => $getRoot().getTextContent())).toBe('text');
  });
});
