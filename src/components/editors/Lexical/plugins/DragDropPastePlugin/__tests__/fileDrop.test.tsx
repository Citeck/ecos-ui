import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { $createTableNodeWithDimensions, TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { act, render, waitFor } from '@testing-library/react';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor, ParagraphNode, TextNode } from 'lexical';
import React from 'react';

import DragDropPaste from '..';
import { FileNode } from '../../../nodes/FileNode';
import { ImageNode } from '../../../nodes/ImageNode';
import ImagesPlugin from '../../ImagesPlugin';

import { NotificationManager } from '@/services/notifications';

jest.mock('../../../nodes/ImageComponent', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../nodes/FileNode/FileComponent', () => ({ __esModule: true, default: () => null }));
jest.mock('@/services/notifications', () => ({ NotificationManager: { error: jest.fn() } }));

let editor: LexicalEditor;
const textFile = (name = 'report.txt') => new File(['report'], name, { type: 'text/plain' });
const imageFile = () => new File(['image'], 'picture.png', { type: 'image/png' });
const record = (file: File) => ({
  name: file.name,
  size: file.size,
  fileRecordId: `emodel/attachment@${file.name}`,
  data: { entityRef: `emodel/attachment@${file.name}` }
});

function required<T>(value: T | null): T {
  if (value === null) {
    throw new Error('Expected fixture node');
  }
  return value;
}

function CaptureEditor() {
  [editor] = useLexicalComposerContext();
  return null;
}

function selectParagraph(index: number, offset: number) {
  required(required($getRoot().getChildAtIndex<ParagraphNode>(index)).getFirstChild<TextNode>()).select(offset, offset);
}

async function setup(onFilesUpload?: (files: File[]) => Promise<any>, editable = true) {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'drop-files',
        nodes: [ImageNode, FileNode, TableNode, TableRowNode, TableCellNode],
        editable,
        theme: {},
        onError: error => {
          throw error;
        }
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <CaptureEditor />
      <ImagesPlugin />
      <DragDropPaste onFilesUpload={onFilesUpload} />
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
      selectParagraph(1, 7);
    });
  });
}

async function drop(files: File[]) {
  await act(async () => {
    editor.dispatchCommand(DRAG_DROP_PASTE, files);
  });
}

function blocks(): any[] {
  return editor.getEditorState().toJSON().root.children;
}

function contents(children: any[]) {
  return children.map(node => node.text ?? `[${node.type === 'file' ? node.name : node.altText}]`).join('');
}

describe('direct file drops (COREDEV-616)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads nonimage files and inserts them at the drop selection', async () => {
    const files = [textFile()];
    const upload = jest.fn(async values => values.map(record));
    await setup(upload);
    await drop(files);
    await waitFor(() => expect(contents(blocks()[1].children)).toBe('Middle [report.txt]line'));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith(files);
    expect(contents(blocks()[2].children)).toBe('Last line');
  });

  it.each([false, true])('inserts into a first-row table cell (empty: %s)', async empty => {
    await setup(async files => files.map(record));
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
    await drop([textFile()]);
    await waitFor(() =>
      expect(contents(blocks()[1].children[0].children[1].children[0].children)).toBe(empty ? '[report.txt]' : 'Cell [report.txt]text')
    );
    expect(blocks()[1].children).toHaveLength(3);
    expect(blocks()[1].children.every((row: any) => row.children.length === 2)).toBe(true);
  });

  it('preserves the order of a mixed file/image batch without uploading the image twice', async () => {
    const first = textFile('first.txt');
    const image = imageFile();
    const last = textFile('last.txt');
    const upload = jest.fn(async files => files.map(record));
    await setup(upload);
    await drop([first, image, last]);
    await waitFor(() => expect(contents(blocks()[1].children)).toBe('Middle [first.txt][picture.png][last.txt]line'));
    expect(upload).toHaveBeenCalledWith([first, last]);
    const imageNode = blocks()[1].children.find((node: any) => node.type === 'image');
    expect(imageNode.src).toMatch(/^data:image\/png;base64,/);
    editor.getEditorState().read(() => {
      const paragraph = required($getRoot().getChildAtIndex<ParagraphNode>(1));
      const imageNode = paragraph.getChildren().find(node => node instanceof ImageNode) as ImageNode | undefined;
      expect(imageNode?.getFile()).toBe(image);
    });
  });

  it('keeps the original drop point when the cursor moves during upload', async () => {
    let complete: (records: any[]) => void = () => {
      throw new Error('Upload not started');
    };
    await setup(
      () =>
        new Promise(resolve => {
          complete = resolve;
        })
    );
    const files = [textFile()];
    await drop(files);
    await act(async () => {
      editor.update(() => {
        selectParagraph(2, 0);
      });
    });
    await act(async () => {
      complete(files.map(record));
    });
    await waitFor(() => expect(contents(blocks()[1].children)).toBe('Middle [report.txt]line'));
    expect(contents(blocks()[2].children)).toBe('Last line');
  });

  it('keeps successful images if attachment upload fails and does not insert broken files', async () => {
    await setup(async () => undefined);
    await drop([textFile(), imageFile()]);
    await waitFor(() => expect(contents(blocks()[1].children)).toBe('Middle [picture.png]line'));
    expect(blocks()[1].children.some((node: any) => node.type === 'file')).toBe(false);
  });

  it('reports a rejected upload without an unhandled rejection or document mutation', async () => {
    await setup(async () => {
      throw new Error('upload unavailable');
    });
    const before = blocks();
    await drop([textFile()]);
    await waitFor(() => expect(NotificationManager.error).toHaveBeenCalled());
    expect(blocks()).toEqual(before);
  });

  it('retains image-only drops without an attachment uploader', async () => {
    await setup();
    await drop([imageFile()]);
    await waitFor(() => expect(contents(blocks()[1].children)).toBe('Middle [picture.png]line'));
  });

  it('keeps uploaded attachments and reports a failed image read in the same batch', async () => {
    const reader = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function () {
      this.dispatchEvent(new Event('error'));
    });
    try {
      await setup(async files => files.map(record));
      await drop([imageFile(), textFile()]);
      await waitFor(() => expect(contents(blocks()[1].children)).toBe('Middle [report.txt]line'));
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
    } finally {
      reader.mockRestore();
    }
  });

  it('does not upload ordinary files when attachments are not enabled', async () => {
    await setup();
    const before = blocks();
    await drop([textFile()]);
    expect(blocks()).toEqual(before);
  });

  it('does not upload files into a read-only editor', async () => {
    const upload = jest.fn(async files => files.map(record));
    await setup(upload, false);
    await drop([textFile()]);
    expect(upload).not.toHaveBeenCalled();
  });
});
