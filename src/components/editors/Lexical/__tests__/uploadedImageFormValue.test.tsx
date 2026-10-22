import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { act, render, waitFor } from '@testing-library/react';
import { $createParagraphNode, $getRoot, LexicalEditor, UNDO_COMMAND } from 'lexical';
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import Editor from '../Editor';
import { FlashMessageContext } from '../context/FlashMessageContext';
import { SettingsContext } from '../context/SettingsContext';
import { SharedHistoryContext } from '../context/SharedHistoryContext';
import { ToolbarContext } from '../context/ToolbarContext';
import PlaygroundNodes from '../nodes/PlaygroundNodes';
import { INSERT_IMAGE_COMMAND } from '../plugins/ImagesPlugin';
import { TableContext } from '../plugins/TablePlugin';

jest.mock('../nodes/ImageComponent', () => ({ __esModule: true, default: () => null }));

const SRC = 'data:image/png;base64,iVBORw0KGgo=';
const URL = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/attachment@uploaded-picture';
let editor: LexicalEditor;
let savedValue: any;

function CaptureEditor() {
  [editor] = useLexicalComposerContext();
  return null;
}

async function setup(onUpload: () => Promise<string>) {
  class FakeImage {
    onload: (() => void) | null = null;
    set src(_src: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  }
  (window as any).Image = FakeImage;
  const store = createStore(() => ({ comments: {}, view: { isMobile: false }, user: {}, workspaces: {} }));
  render(
    <Provider store={store}>
      <SettingsContext>
        <LexicalComposer
          initialConfig={{
            namespace: 'form-value',
            nodes: PlaygroundNodes,
            theme: {},
            onError: error => {
              throw error;
            }
          }}
        >
          <FlashMessageContext>
            <SharedHistoryContext>
              <TableContext>
                <ToolbarContext>
                  <Editor
                    hideToolbar
                    onUpload={onUpload}
                    onChange={state => {
                      savedValue = state.toJSON();
                    }}
                  />
                  <CaptureEditor />
                </ToolbarContext>
              </TableContext>
            </SharedHistoryContext>
          </FlashMessageContext>
        </LexicalComposer>
      </SettingsContext>
    </Provider>
  );
  await act(async () => {
    editor.update(() => {
      $getRoot().clear().append($createParagraphNode());
      $getRoot().selectEnd();
    });
  });
}

async function insert() {
  await act(async () => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: SRC,
      altText: 'picture.png',
      file: new File(['picture'], 'picture.png', { type: 'image/png' })
    });
  });
}

function savedImages(): any[] {
  return savedValue?.root.children.flatMap((node: any) => node.children || []).filter((node: any) => node.type === 'image') || [];
}

describe('form value after asynchronous image upload (COREDEV-616)', () => {
  beforeEach(() => {
    savedValue = undefined;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addListener: jest.fn(), removeListener: jest.fn() });
  });
  it('uploads a dropped image once, emits its URL to the form and keeps removal in one undo step', async () => {
    const file = new File(['picture'], 'picture.png', { type: 'image/png' });
    const upload = jest.fn(async () => URL);
    await setup(upload);
    await act(async () => {
      editor.dispatchCommand(DRAG_DROP_PASTE, [file]);
    });
    await waitFor(() => expect(savedImages().map(node => node.src)).toEqual([URL]));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith(file, file.name);
    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    await waitFor(() => expect(savedImages()).toEqual([]));
  });

  it('removes a failed image from the form value as well as from the editor', async () => {
    let fail: (error: Error) => void = () => {
      throw new Error('Upload not started');
    };
    await setup(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        })
    );
    await insert();
    await waitFor(() => expect(savedImages().map(node => node.src)).toEqual([SRC]));
    await act(async () => {
      fail(new Error('upload failed'));
    });
    await waitFor(() => expect(savedImages()).toEqual([]));
    expect(savedValue).toBeDefined();
  });
});
