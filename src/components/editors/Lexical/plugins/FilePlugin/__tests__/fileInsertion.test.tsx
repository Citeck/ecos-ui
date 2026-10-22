import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $createTableNodeWithDimensions, TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { $createParagraphNode, $createTextNode, $getRoot, $setSelection, LexicalEditor, ParagraphNode, TextNode } from 'lexical';
import React from 'react';

import FilePlugin, { UploadFilesInCommentProps } from '..';
import { FileNode } from '../../../nodes/FileNode';
import { OPEN_UPLOAD_MODAL, UPLOAD_FILE_COMMAND } from '../constants';

jest.mock('react-redux', () => ({ connect: () => (component: any) => component }));
jest.mock('@/components/common', () => ({
  EcosModal: ({ isOpen, hideModal, children }: any) =>
    isOpen ? (
      <div role="dialog">
        <button onClick={hideModal}>Cancel</button>
        {children}
      </div>
    ) : null
}));
jest.mock('@/components/dashboard/widgets/Documents/parts/DropZone', () => ({
  __esModule: true,
  default: ({ onSelect }: any) => <button onClick={() => onSelect([new File(['data'], 'report.txt')], jest.fn())}>Upload</button>
}));
jest.mock('../../../nodes/FileNode/FileComponent', () => ({
  __esModule: true,
  default: ({ name }: any) => <span>{name}</span>
}));
jest.mock('@/helpers/urls', () => ({ getRecordRef: () => 'emodel/ept-issue@COREDEV-616' }));
jest.mock('@/selectors/comments', () => ({ selectStateByRecordRef: () => ({}) }));

let editor: LexicalEditor;
let upload: UploadFilesInCommentProps;
const addUploadedEntityRefs = jest.fn();
const file = (name = 'report.txt') => ({
  name,
  size: 4,
  fileRecordId: `emodel/attachment@${name}`,
  data: { entityRef: `emodel/attachment@${name}` }
});

function required<T>(value: T | null): T {
  if (value === null) {
    throw new Error('Expected fixture node to exist');
  }
  return value;
}

function selectParagraph(index: number, start: number, end = start) {
  const paragraph = required($getRoot().getChildAtIndex<ParagraphNode>(index));
  required(paragraph.getFirstChild<TextNode>()).select(start, end);
}

function CaptureEditor() {
  [editor] = useLexicalComposerContext();
  return <button onClick={() => editor.dispatchCommand(OPEN_UPLOAD_MODAL, undefined)}>Attach</button>;
}

async function setup() {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'file-insertion',
        nodes: [FileNode, TableNode, TableRowNode, TableCellNode],
        theme: {},
        onError: error => {
          throw error;
        }
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <CaptureEditor />
      <FilePlugin
        isUploadingFile={false}
        uploadFilesInComment={params => {
          upload = params;
        }}
        UploadDocsService={{ addUploadedEntityRefs } as any}
      />
    </LexicalComposer>
  );
  await act(async () => {
    editor.update(() => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode('First line')),
          $createParagraphNode().append($createTextNode('Middle line')),
          $createParagraphNode().append($createTextNode('Last line'))
        );
    });
  });
}

async function startUpload() {
  fireEvent.click(screen.getByText('Attach'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  // Modal focus and upload completion must not make us lose the insertion position.
  await act(async () => {
    editor.update(() => {
      $setSelection(null);
    });
  });
  fireEvent.click(screen.getByText('Upload'));
}

async function finishUpload(files = [file()]) {
  await act(async () => {
    upload.uploadCallback(files);
  });
}

function paragraphs() {
  return editor.getEditorState().toJSON().root.children;
}

describe('uploaded file insertion at the cursor (COREDEV-616)', () => {
  beforeEach(() => {
    addUploadedEntityRefs.mockClear();
  });

  it.each([0, 7, 11])('inserts at offset %i in a middle paragraph after the upload modal loses focus', async offset => {
    await setup();
    await act(async () => {
      editor.update(() => {
        selectParagraph(1, offset);
      });
    });
    await startUpload();
    await finishUpload();
    const blocks = paragraphs() as any[];
    expect(blocks).toHaveLength(3);
    expect(blocks[0].children[0].text).toBe('First line');
    expect(blocks[2].children[0].text).toBe('Last line');
    expect(blocks[1].children.filter((node: any) => node.type === 'file')).toHaveLength(1);
    expect(blocks[1].children.map((node: any) => node.text ?? `[${node.name}]`).join('')).toBe(
      `Middle line`.slice(0, offset) + '[report.txt]' + `Middle line`.slice(offset)
    );
    expect(addUploadedEntityRefs).toHaveBeenCalledWith(['emodel/attachment@report.txt']);
  });

  it.each([false, true])('keeps the file in the first table row and selected cell (empty: %s)', async empty => {
    await setup();
    await act(async () => {
      editor.update(() => {
        const table = $createTableNodeWithDimensions(3, 2, false);
        required($getRoot().getChildAtIndex(0)).insertAfter(table);
        const cell = required(required(table.getFirstChild<TableRowNode>()).getChildAtIndex<TableCellNode>(1));
        const paragraph = required(cell.getFirstChild<ParagraphNode>());
        if (empty) {
          paragraph.selectStart();
        } else {
          const text = $createTextNode('Cell text');
          paragraph.append(text);
          text.select(5, 5);
        }
      });
    });
    await startUpload();
    await finishUpload();
    const blocks = paragraphs() as any[];
    expect(blocks).toHaveLength(4);
    expect(blocks[1].type).toBe('table');
    expect(blocks[1].children).toHaveLength(3);
    expect(blocks[1].children.every((row: any) => row.children.length === 2)).toBe(true);
    expect(blocks[1].children[0].children[1].children[0].children.map((node: any) => node.text ?? `[${node.name}]`).join('')).toBe(
      empty ? '[report.txt]' : 'Cell [report.txt]text'
    );
    expect(blocks[3].children[0].text).toBe('Last line');
  });

  it('replaces selected text and preserves the uploaded file order', async () => {
    await setup();
    await act(async () => {
      editor.update(() => {
        selectParagraph(1, 0, 6);
      });
    });
    await startUpload();
    await finishUpload([file('one.txt'), file('two.txt')]);
    expect((paragraphs()[1] as any).children.map((node: any) => node.text ?? `[${node.name}]`).join('')).toBe('[one.txt][two.txt] line');
  });

  it('uses the new cursor after cancelling and reopening the upload modal', async () => {
    await setup();
    await act(async () => {
      editor.update(() => {
        selectParagraph(0, 0);
      });
    });
    fireEvent.click(screen.getByText('Attach'));
    fireEvent.click(screen.getByText('Cancel'));
    await act(async () => {
      editor.update(() => {
        selectParagraph(1, 7);
      });
    });
    await startUpload();
    await finishUpload();
    expect((paragraphs()[0] as any).children[0].text).toBe('First line');
    expect((paragraphs()[1] as any).children.some((node: any) => node.type === 'file')).toBe(true);
  });

  it('falls back to the end if the original insertion node was removed during upload', async () => {
    await setup();
    await act(async () => {
      editor.update(() => {
        selectParagraph(1, 7);
      });
    });
    await startUpload();
    await act(async () => {
      editor.update(() => {
        required($getRoot().getChildAtIndex(1)).remove();
        $setSelection(null);
      });
    });
    await finishUpload();
    expect((paragraphs()[1] as any).children.map((node: any) => node.text ?? `[${node.name}]`).join('')).toBe('Last line[report.txt]');
  });

  it('uses the current selection for direct insertion without an upload modal', async () => {
    await setup();
    await act(async () => {
      editor.update(() => {
        selectParagraph(0, 0);
        editor.dispatchCommand(UPLOAD_FILE_COMMAND, [file()]);
      });
    });
    expect((paragraphs()[0] as any).children[0].type).toBe('file');
  });

  it('adds a file to an empty editor without a cursor', async () => {
    await setup();
    await act(async () => {
      editor.update(() => {
        $getRoot().clear();
        $setSelection(null);
      });
    });
    await startUpload();
    await finishUpload();
    expect((paragraphs()[0] as any).children[0].type).toBe('file');
  });

  it('leaves the document and tracked attachments unchanged after a failed upload', async () => {
    await setup();
    const before = paragraphs();
    await startUpload();
    await finishUpload([]);
    expect(paragraphs()).toEqual(before);
    expect(addUploadedEntityRefs).not.toHaveBeenCalled();
  });
});
