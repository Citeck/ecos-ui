/* eslint-disable header/header */
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { act, render } from '@testing-library/react';
import { $getRoot, $nodesOfType, LexicalEditor, REDO_COMMAND, UNDO_COMMAND } from 'lexical';
import React, { JSX } from 'react';

import { SharedHistoryContext, useSharedHistoryContext } from '../../../context/SharedHistoryContext';
import { ImageNode } from '../../../nodes/ImageNode';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from '../../ImagesPlugin';
import OnImageUploadPlugin, { OnImageUpload } from '../index';

/**
 * A pasted image is inserted straight away with a base64 `src` and the `File` still on the node —
 * `__file` is what `ImageNode.decorate` shows the spinner for — and the upload replaces both a
 * moment later. That replacement is an async side effect, not an edit the user made, so it must
 * never become its own undo step: otherwise Ctrl+Z right after a paste rewinds to the mid-upload
 * snapshot, the image stays put with the spinner back on and nothing ever finishes it (COREDEV-454).
 */

jest.mock('../../../nodes/ImageComponent', () => ({
  __esModule: true,
  default: () => null
}));

const SRC = 'data:image/png;base64,iVBORw0KGgo=';
const UPLOADED = 'https://example.org/gateway/emodel/content?ref=attachment@1';

let editor: LexicalEditor;

function CaptureEditor(): null {
  [editor] = useLexicalComposerContext();
  return null;
}

/** the same wiring as Editor.tsx: history and the upload plugin share one state through the context */
function SharedHistory(): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  return <HistoryPlugin externalHistoryState={historyState} />;
}

/** jsdom never loads images, so `new Image()` would never fire onload and the upload would hang. */
function stubImageLoading(succeeds = true): void {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      setTimeout(() => (succeeds ? this.onload?.() : this.onerror?.()), 0);
    }
  }

  (window as any).Image = FakeImage;
}

async function renderEditor(onUpload: OnImageUpload): Promise<void> {
  render(
    <SharedHistoryContext>
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
        <SharedHistory />
        <ImagesPlugin />
        <OnImageUploadPlugin onUpload={onUpload} />
        <CaptureEditor />
      </LexicalComposer>
    </SharedHistoryContext>
  );

  // Lexical builds the root paragraph while the composer is still rendering, before HistoryPlugin
  // has registered, so history starts with no state of its own; placing the caret gives it one,
  // the same way clicking into the editor does before anyone pastes anything into it.
  act(() => {
    editor.update(() => {
      $getRoot().selectEnd();
    });
  });
  await commit();
}

/** Lexical commits an update in a microtask, so nothing is readable from the state before a tick. */
const commit = async (): Promise<void> => {
  await act(async () => undefined);
};

/** ...and the upload chain adds a couple of promise/timer hops on top of that. */
const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

async function pasteImage(file: File): Promise<void> {
  act(() => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, { altText: file.name, src: SRC, file });
  });
  await commit();
}

async function type(text: string): Promise<void> {
  act(() => {
    editor.update(() => {
      $getRoot().selectEnd().insertText(text);
    });
  });
  await commit();
}

async function dispatch(command: typeof UNDO_COMMAND): Promise<void> {
  act(() => {
    editor.dispatchCommand(command, undefined);
  });
  await commit();
}

type ImageState = { src: string; hasFile: boolean };

function images(): ImageState[] {
  return editor.getEditorState().read(() => $nodesOfType(ImageNode).map(node => ({ src: node.getSrc(), hasFile: !!node.getFile() })));
}

function text(): string {
  return editor.getEditorState().read(() => $getRoot().getTextContent());
}

/** every call gets its own pending upload; the test finishes them one by one */
function queuedUploads() {
  const settlers: Array<{ resolve: (url: string) => void; reject: (error: Error) => void }> = [];
  const onUpload = jest.fn(() => new Promise<string>((resolve, reject) => settlers.push({ resolve, reject })));

  return {
    onUpload,
    finish: (index: number, url: string) => act(() => settlers[index].resolve(url)),
    fail: (index: number) => act(() => settlers[index].reject(new Error('no connection')))
  };
}

function newFile(name = 'screenshot.png'): File {
  return new File(['x'], name, { type: 'image/png' });
}

/** an upload that only finishes when the test says so, to look at the editor mid-upload */
function deferredUpload() {
  let finish: (url: string) => void = () => undefined;
  const onUpload = jest.fn(() => new Promise<string>(resolve => (finish = resolve)));

  return { onUpload, finish: (url = UPLOADED) => act(() => finish(url)) };
}

describe('OnImageUploadPlugin — undo of a pasted image', () => {
  beforeEach(() => {
    stubImageLoading();
    // restoring a state that ends in a text caret makes Lexical measure the caret's Range to scroll
    // it into view; jsdom has no layout, and no Range.getBoundingClientRect at all
    const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
    Range.prototype.getBoundingClientRect = () => rect;
    Range.prototype.getClientRects = () =>
      ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList;
  });

  it('uploads the pasted file and clears the spinner', async () => {
    const { onUpload, finish } = deferredUpload();
    await renderEditor(onUpload);

    await pasteImage(newFile());
    expect(images()).toEqual([{ src: SRC, hasFile: true }]);

    finish();
    await flush();

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(images()).toEqual([{ src: UPLOADED, hasFile: false }]);
  });

  it('Ctrl+Z after the upload has finished removes the image instead of rewinding to the spinner', async () => {
    await renderEditor(jest.fn().mockResolvedValue(UPLOADED));

    await pasteImage(newFile());
    await flush();

    await dispatch(UNDO_COMMAND);
    await flush();

    expect(images()).toEqual([]);
  });

  it('Ctrl+Y after that undo brings the uploaded image back, without a second upload', async () => {
    const onUpload = jest.fn().mockResolvedValue(UPLOADED);
    await renderEditor(onUpload);

    await pasteImage(newFile());
    await flush();
    await dispatch(UNDO_COMMAND);
    await flush();

    await dispatch(REDO_COMMAND);
    await flush();

    expect(images()).toEqual([{ src: UPLOADED, hasFile: false }]);
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Z while the upload is still in flight removes the image and the upload does not bring it back', async () => {
    const { onUpload, finish } = deferredUpload();
    await renderEditor(onUpload);

    await pasteImage(newFile());
    expect(images()).toHaveLength(1);

    await dispatch(UNDO_COMMAND);
    expect(images()).toEqual([]);

    finish();
    await flush();

    expect(images()).toEqual([]);
  });

  it('an undo that lands on a mid-upload snapshot finishes the image off instead of hanging the spinner', async () => {
    const { onUpload, finish } = deferredUpload();
    await renderEditor(onUpload);

    // the text is typed while the upload is still in the air, so it becomes an undo step of its
    // own with the half-uploaded image in it — that snapshot is what the undo below lands on
    await pasteImage(newFile());
    await type('a caption typed while it was uploading');
    expect(images()).toEqual([{ src: SRC, hasFile: true }]);

    finish();
    await flush();
    expect(images()).toEqual([{ src: UPLOADED, hasFile: false }]);

    // one step back: the text goes, the image stays — and it must not stay half-uploaded
    await dispatch(UNDO_COMMAND);
    await flush();

    expect(images()).toEqual([{ src: UPLOADED, hasFile: false }]);
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('an upload finishing for a file the node no longer carries leaves the node alone', async () => {
    const { onUpload, finish } = queuedUploads();
    await renderEditor(onUpload);

    await pasteImage(newFile());
    act(() => {
      editor.update(() => $nodesOfType(ImageNode)[0].setFile(newFile('other.png')));
    });
    await commit();
    expect(onUpload).toHaveBeenCalledTimes(2);

    // the first upload belongs to a file that is not on the node any more
    finish(0, UPLOADED);
    await flush();
    expect(images()).toEqual([{ src: SRC, hasFile: true }]);

    finish(1, `${UPLOADED}-other`);
    await flush();
    expect(images()).toEqual([{ src: `${UPLOADED}-other`, hasFile: false }]);
  });

  it('drops the image when the upload fails', async () => {
    await renderEditor(jest.fn().mockRejectedValue(new Error('no connection')));

    await pasteImage(newFile());
    await flush();

    expect(images()).toEqual([]);
  });

  it('a failed paste leaves no empty undo step behind: Ctrl+Z undoes the edit before it', async () => {
    await renderEditor(jest.fn().mockRejectedValue(new Error('no connection')));

    await type('before ');
    await pasteImage(newFile());
    await flush();
    expect(images()).toEqual([]);
    expect(text()).toBe('before ');

    await dispatch(UNDO_COMMAND);
    await flush();

    expect(text()).toBe('');
  });

  it('Ctrl+Z onto a snapshot with a failed image uploads it again instead of dropping it from the old failure', async () => {
    const { onUpload, finish, fail } = queuedUploads();
    await renderEditor(onUpload);

    // the failure arrives after the author has typed, so the paste stays a step of its own
    await pasteImage(newFile());
    await type('typed after the paste');
    fail(0);
    await flush();
    expect(images()).toEqual([]);
    expect(text()).toBe('typed after the paste');

    await dispatch(UNDO_COMMAND);
    await flush();
    expect(text()).toBe('');
    expect(images()).toEqual([{ src: SRC, hasFile: true }]);
    expect(onUpload).toHaveBeenCalledTimes(2);

    finish(1, UPLOADED);
    await flush();
    expect(images()).toEqual([{ src: UPLOADED, hasFile: false }]);
  });

  it('drops the image when the uploaded url does not load', async () => {
    stubImageLoading(false);
    await renderEditor(jest.fn().mockResolvedValue(UPLOADED));

    await pasteImage(newFile());
    await flush();

    expect(images()).toEqual([]);
  });
});
