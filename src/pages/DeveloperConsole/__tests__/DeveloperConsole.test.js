import { act, render } from '@testing-library/react';
import React from 'react';

import DeveloperConsole from '../DeveloperConsole';

let editorMounts = 0;
jest.mock('@/components/editors/MonacoEditor/CodeEditor', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: ({ defaultValue }) => {
      ReactLib.useEffect(() => {
        editorMounts += 1;
      }, []);
      return <div data-testid="code-editor">{defaultValue}</div>;
    }
  };
});

jest.mock('@/components/ai/AIAssistant/ScriptEditorAIButton', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/helpers/indexedDB', () => ({
  snippetsStore: { getAll: () => Promise.resolve([]), put: () => Promise.resolve(), delete: () => Promise.resolve() }
}));

describe('DeveloperConsole', () => {
  beforeEach(() => {
    editorMounts = 0;
    localStorage.clear();
  });

  /**
   * COREDEV-3691: `hidden` is derived from window.location, so every page-tab switch flips it.
   * Unmounting the editor on hide destroys the Monaco model — the edited text and the undo/redo
   * history — and the remount shows the stale defaultValue. The editor must survive a hide/show cycle.
   */
  it('keeps the editor mounted across a hide/show cycle', async () => {
    const { rerender, findByTestId, queryByTestId } = render(<DeveloperConsole hidden={false} />);
    const editor = await findByTestId('code-editor');
    await act(() => Promise.resolve());

    rerender(<DeveloperConsole hidden />);
    rerender(<DeveloperConsole hidden={false} />);

    expect(queryByTestId('code-editor')).toBe(editor);
    expect(editorMounts).toBe(1);
  });

  it('does not paint the console while hidden', async () => {
    const { container, rerender, findByTestId } = render(<DeveloperConsole hidden={false} />);
    await findByTestId('code-editor');
    await act(() => Promise.resolve());

    rerender(<DeveloperConsole hidden />);

    const root = container.querySelector('.developer-console-container');
    expect(root === null || root.classList.contains('d-none')).toBe(true);
  });

  it('does not load the editor until the console is first shown', async () => {
    const { queryByTestId } = render(<DeveloperConsole hidden />);
    await act(() => Promise.resolve());

    expect(queryByTestId('code-editor')).toBeNull();
    expect(editorMounts).toBe(0);
  });
});
