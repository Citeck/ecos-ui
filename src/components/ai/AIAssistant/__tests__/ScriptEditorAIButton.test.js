import { render } from '@testing-library/react';
import React from 'react';

import ScriptEditorAIButton from '../ScriptEditorAIButton';

let capturedProps = null;
jest.mock('../AIQuickActions/components', () => ({
  AIFieldActions: props => {
    capturedProps = props;
    return null;
  }
}));

jest.mock('../ScriptAIService', () => ({
  __esModule: true,
  generateScript: jest.fn(() => Promise.resolve({ generatedText: '', explanation: '' }))
}));

jest.mock('../EditorContextService', () => ({
  __esModule: true,
  default: { getContextData: () => ({}) }
}));

const baseProps = {
  recordRef: 'emodel/type@service-note',
  scriptContextType: 'computed_attribute',
  getEditorValue: () => '',
  setEditorValue: () => {}
};

describe('ScriptEditorAIButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = null;
  });

  /**
   * D-B-1: the quick-actions and result popups are anchored to a small trigger button, so with
   * nothing to bound them they are limited by the window alone and cover the code being edited.
   * The rich-text and plain-textarea entry points were wired when the defect was fixed; this one
   * was missed, which left every script editor (computed attribute/role, journal formatter, BPMN
   * script task) with the original behaviour.
   */
  it('passes the editor element down so the popups can be bounded by it', () => {
    const editor = document.createElement('div');

    render(<ScriptEditorAIButton {...baseProps} fieldElement={editor} />);

    expect(capturedProps.fieldElement).toBe(editor);
  });

  it('stays usable when no editor element is available', () => {
    render(<ScriptEditorAIButton {...baseProps} />);

    expect(capturedProps).not.toBeNull();
    expect(capturedProps.fieldElement).toBeUndefined();
  });
});
