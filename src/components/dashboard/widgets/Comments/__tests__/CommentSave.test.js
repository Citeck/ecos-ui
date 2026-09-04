import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';

import PlaygroundNodes from '@/components/editors/Lexical/nodes/PlaygroundNodes';

import { Comment, LENGTH_LIMIT } from '../Comment';

// The text that goes to the server is generated from the live document right before the save,
// after the edges have been trimmed. Both storage formats must come out of the same trimmed
// content. Nothing is serialised while the author types: an html export of the whole document
// (and a JSON dump of the editor state) on every keystroke is wasted work, and exporting an image
// node builds an <img> the browser starts downloading (COREDEV-380).

jest.mock('@lexical/html', () => {
  const actual = jest.requireActual('@lexical/html');

  return { ...actual, $generateHtmlFromNodes: jest.fn(actual.$generateHtmlFromNodes) };
});

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

const commentWith = (dataStorageFormat, editor, props = {}) => {
  const comment = new Comment({ dataStorageFormat, ...props });
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

  // No editor means the author never touched the document (the activities widget saves an edited
  // record even when only its other fields changed, and never announces its editor on load): the
  // stored text must survive that save untouched, whatever the storage format
  it('keeps the stored text when no editor has announced itself', () => {
    const stored = { comment: { id: 'c1', text: '<p>stored</p>' } };

    expect(commentWith('html', undefined, stored).handleTextBeforeSave()).toBe('<p>stored</p>');
    expect(commentWith('raw', undefined, stored).handleTextBeforeSave()).toBe('<p>stored</p>');
    expect(commentWith('html', undefined).handleTextBeforeSave()).toBe('');
    // a record whose text is empty loads it as null
    expect(commentWith('html', undefined, { comment: { id: 'c2', text: null } }).handleTextBeforeSave()).toBe('');
  });

  // The Activity of an existing record stays mounted between two edit sessions; an editor closed
  // in the first must not lend its (possibly abandoned) document to a save in the second
  it('forgets the editor once the editor is closed', () => {
    const editor = newEditor();
    fill(editor, padded);
    const comment = commentWith('html', editor, { comment: { id: 'c1', text: '<p>stored</p>' } });
    comment.setState = jest.fn();

    comment.handleCloseEditor();

    expect(comment.handleTextBeforeSave()).toBe('<p>stored</p>');
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

describe('Comment — what happens while the author types', () => {
  // the change handler gets the editor and its state the way OnChangePlugin hands them over
  const typeInto = (comment, editor) => {
    comment.setState = jest.fn();
    comment.handleEditorStateChange(editor.getEditorState(), editor, false);

    return comment.setState.mock.calls[0][0];
  };

  beforeEach(() => $generateHtmlFromNodes.mockClear());

  it('does not serialise the document on a change', () => {
    const editor = newEditor();
    fill(editor, padded);
    const comment = commentWith('html', editor);

    const state = typeInto(comment, editor);

    expect($generateHtmlFromNodes).not.toHaveBeenCalled();
    expect(state).not.toHaveProperty('htmlComment');
    expect(state).not.toHaveProperty('rawComment');
    expect(state).toMatchObject({ isEditorEmpty: false, isMaxLength: false });
  });

  // Activity in the activities widget extends Comment and wires only onChange, never onEditorReady
  it('remembers the editor handed over through onChange, so a subclass without onEditorReady still saves the document', () => {
    const editor = newEditor();
    fill(editor, padded);
    const comment = commentWith('html', undefined);

    typeInto(comment, editor);

    expect(comment.handleTextBeforeSave()).toContain('>text<');
  });

  it('flags the length limit from the document, the way the editor counts it', () => {
    const editor = newEditor();
    fill(editor, () => [paragraph($createTextNode('x'.repeat(LENGTH_LIMIT - 1)))]);
    const comment = commentWith('html', editor);

    expect(typeInto(comment, editor)).toMatchObject({ isMaxLength: false });

    fill(editor, () => [paragraph($createTextNode('x'.repeat(LENGTH_LIMIT)))]);

    expect(typeInto(comment, editor)).toMatchObject({ isMaxLength: true });
  });
});
