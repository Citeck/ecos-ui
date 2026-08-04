import { render } from '@testing-library/react';
import React from 'react';

import ChatInput from '../components/ChatInput';

import { AGENT_ENGINE, FILE_UPLOAD_ACCEPT_STRING, buildAcceptString, FILE_UPLOAD_WHITELIST } from '@/components/ai/AIAssistant/constants';

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

describe('ChatInput file accept attribute', () => {
  const defaultProps = {
    textareaRef: { current: null },
    message: '',
    isLoading: false,
    isUniversal: true,
    isUploadingFile: false,
    onInputChange: jest.fn(),
    onKeyDown: jest.fn(),
    onFileUploadClick: jest.fn(),
    onClearConversation: jest.fn(),
    fileInputRef: { current: null },
    onFileUpload: jest.fn()
  };

  const getFileInput = container => container.querySelector('input[type="file"]');

  it('renders a hidden multi-file <input> with type=file', () => {
    const { container } = render(<ChatInput {...defaultProps} />);
    const fileInput = getFileInput(container);
    expect(fileInput).toBeTruthy();
    expect(fileInput.getAttribute('multiple')).not.toBeNull();
  });

  it('uses the dynamic accept string built from FILE_UPLOAD_WHITELIST', () => {
    const { container } = render(<ChatInput {...defaultProps} />);
    const fileInput = getFileInput(container);
    expect(fileInput.getAttribute('accept')).toBe(FILE_UPLOAD_ACCEPT_STRING);
    expect(fileInput.getAttribute('accept')).toBe(buildAcceptString(FILE_UPLOAD_WHITELIST));
  });

  it('accept attribute exposes new media types: images, tables, presentations, code', () => {
    const { container } = render(<ChatInput {...defaultProps} />);
    const accept = getFileInput(container).getAttribute('accept');
    const exts = accept.split(',');
    // images
    expect(exts).toEqual(expect.arrayContaining(['.png', '.jpg', '.jpeg', '.gif', '.webp']));
    // tables
    expect(exts).toEqual(expect.arrayContaining(['.xlsx', '.xls', '.csv']));
    // presentations
    expect(exts).toEqual(expect.arrayContaining(['.pptx', '.ppt']));
    // text/code
    expect(exts).toEqual(expect.arrayContaining(['.json', '.yaml', '.yml']));
  });

  it('accept attribute preserves legacy document types for backward compatibility', () => {
    const { container } = render(<ChatInput {...defaultProps} />);
    const exts = getFileInput(container).getAttribute('accept').split(',');
    expect(exts).toEqual(expect.arrayContaining(['.pdf', '.doc', '.docx', '.txt', '.rtf', '.bpmn', '.xml']));
  });

  it('accept attribute does NOT expose blocklisted types (executables, archives, svg, media)', () => {
    const { container } = render(<ChatInput {...defaultProps} />);
    const accept = getFileInput(container).getAttribute('accept');
    expect(accept).not.toMatch(/\.exe(\b|,)/);
    expect(accept).not.toMatch(/\.svg(\b|,)/);
    expect(accept).not.toMatch(/\.zip(\b|,)/);
    expect(accept).not.toMatch(/\.mp4(\b|,)/);
    expect(accept).not.toMatch(/\.bat(\b|,)/);
  });

  it('hides the file picker actions in non-universal mode but still renders the file input', () => {
    const { container } = render(<ChatInput {...defaultProps} isUniversal={false} />);
    const fileInput = getFileInput(container);
    expect(fileInput).toBeTruthy();
    expect(fileInput.getAttribute('accept')).toBe(FILE_UPLOAD_ACCEPT_STRING);
  });
});

describe('ChatInput placeholder by agent engine', () => {
  const baseProps = {
    textareaRef: { current: null },
    message: '',
    isLoading: false,
    isUniversal: true,
    isUploadingFile: false,
    onInputChange: jest.fn(),
    onKeyDown: jest.fn(),
    onFileUploadClick: jest.fn(),
    onClearConversation: jest.fn(),
    fileInputRef: { current: null },
    onFileUpload: jest.fn()
  };

  const getPlaceholder = props =>
    render(<ChatInput {...baseProps} {...props} />)
      .container.querySelector('textarea')
      .getAttribute('placeholder');

  it('no agent selected — keeps the neutral universal placeholder', () => {
    expect(getPlaceholder({ selectedAgent: null })).toBe('ai-assistant.input.placeholder.universal');
  });

  it('TOOL_LOOP agent — operational placeholder', () => {
    expect(getPlaceholder({ selectedAgent: { id: 'tasks-documents-helper', engine: AGENT_ENGINE.TOOL_LOOP } })).toBe(
      'ai-assistant.input.placeholder.operational'
    );
  });

  it('CONFIG agent — universal (artifact creation) placeholder', () => {
    expect(getPlaceholder({ selectedAgent: { id: 'platform-config-agent', engine: AGENT_ENGINE.CONFIG } })).toBe(
      'ai-assistant.input.placeholder.universal'
    );
  });

  it('legacy agent DTO without `engine` — operational placeholder via getAgentEngine fallback', () => {
    expect(getPlaceholder({ selectedAgent: { id: 'legacy-agent' } })).toBe('ai-assistant.input.placeholder.operational');
  });

  it('contextual tab — contextual placeholder regardless of the selected agent', () => {
    expect(getPlaceholder({ isUniversal: false, selectedAgent: { id: 'tasks-documents-helper', engine: AGENT_ENGINE.TOOL_LOOP } })).toBe(
      'ai-assistant.input.placeholder.contextual'
    );
    expect(getPlaceholder({ isUniversal: false, selectedAgent: { id: 'platform-config-agent', engine: AGENT_ENGINE.CONFIG } })).toBe(
      'ai-assistant.input.placeholder.contextual'
    );
  });
});
