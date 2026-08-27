/* eslint-disable header/header */
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { render } from '@testing-library/react';
import { COMMAND_PRIORITY_CRITICAL, LexicalEditor, REDO_COMMAND, UNDO_COMMAND } from 'lexical';
import React from 'react';

import { ToolbarContext } from '../../../context/ToolbarContext';
import ShortcutsPlugin from '../index';

/**
 * Undo / redo must follow the physical key, not the character of the current layout (COREDEV-454).
 * Lexical itself recognises Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z by `event.key` only, so on the Russian
 * layout (key `я`, code `KeyZ`) it does nothing — and the browser's own undo, the only thing left,
 * fires only while its native stack has an entry, which a paste or an inserted node never adds.
 * The events here are dispatched on the editor's root element, exactly where a real keydown lands,
 * so Lexical's own handler runs first and the test also proves the Latin key is not undone twice.
 */

let editor: LexicalEditor;

function CaptureEditor(): null {
  [editor] = useLexicalComposerContext();
  return null;
}

function Shortcuts(): React.ReactElement {
  const [activeEditor] = useLexicalComposerContext();
  return <ShortcutsPlugin editor={activeEditor} setIsLinkEditMode={() => undefined} />;
}

function renderEditor() {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        nodes: [],
        onError: (error: Error) => {
          throw error;
        },
        theme: {}
      }}
    >
      <ToolbarContext>
        <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
        <CaptureEditor />
        <Shortcuts />
      </ToolbarContext>
    </LexicalComposer>
  );

  const undo = jest.fn(() => true);
  const redo = jest.fn(() => true);
  editor.registerCommand(UNDO_COMMAND, undo, COMMAND_PRIORITY_CRITICAL);
  editor.registerCommand(REDO_COMMAND, redo, COMMAND_PRIORITY_CRITICAL);

  return { undo, redo };
}

function press(init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  const root = editor.getRootElement();

  if (!root) {
    throw new Error('the editor has no root element');
  }

  root.dispatchEvent(event);

  return event;
}

describe('ShortcutsPlugin — undo / redo by the physical key', () => {
  it('Ctrl+Z on the Russian layout (key я, code KeyZ) undoes once and is consumed', () => {
    const { undo, redo } = renderEditor();

    const event = press({ key: 'я', code: 'KeyZ', ctrlKey: true });

    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('Ctrl+Z on the Latin layout still undoes exactly once — Lexical handles it, the plugin stays out', () => {
    const { undo } = renderEditor();

    const event = press({ key: 'z', code: 'KeyZ', ctrlKey: true });

    expect(undo).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['Ctrl+Shift+я', { key: 'Я', code: 'KeyZ', ctrlKey: true, shiftKey: true }],
    ['Ctrl+н (the key under Y)', { key: 'н', code: 'KeyY', ctrlKey: true }]
  ])('%s redoes once', (_name, init) => {
    const { undo, redo } = renderEditor();

    const event = press(init);

    expect(redo).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['Ctrl+Y', { key: 'y', code: 'KeyY', ctrlKey: true }],
    ['Ctrl+Shift+Z', { key: 'Z', code: 'KeyZ', ctrlKey: true, shiftKey: true }]
  ])('%s on the Latin layout redoes exactly once', (_name, init) => {
    const { redo } = renderEditor();

    press(init);

    expect(redo).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a bare я', { key: 'я', code: 'KeyZ' }],
    ['Ctrl+Alt+я (AltGr)', { key: 'я', code: 'KeyZ', ctrlKey: true, altKey: true }],
    ['Shift+я', { key: 'Я', code: 'KeyZ', shiftKey: true }]
  ])('%s is not an undo', (_name, init) => {
    const { undo, redo } = renderEditor();

    const event = press(init);

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
