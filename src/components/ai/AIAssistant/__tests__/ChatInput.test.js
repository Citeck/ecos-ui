import { render, screen } from '@testing-library/react';
import React from 'react';

import ChatInput from '../components/ChatInput';

import { AGENT_ENGINE, FILE_UPLOAD_ACCEPT_STRING, buildAcceptString, FILE_UPLOAD_WHITELIST } from '@/components/ai/AIAssistant/constants';
import en from '@/i18n/en.json';
import ru from '@/i18n/ru.json';

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

describe('ChatInput accessible names of the icon buttons', () => {
  // `t` is mocked as an identity function in this file, so the accessible name here is the locale
  // key itself. That is exactly what tests 46-47 need to state: the name comes from the intended
  // key rather than from nothing at all. Whether the key is actually translated is asserted
  // separately at the bottom of the block (and set-wide in i18nKeys.test.js).
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

  // Test 46
  it('file upload button is addressable by role and name', () => {
    render(<ChatInput {...baseProps} />);
    const button = screen.getByRole('button', { name: 'ai-assistant.input.upload' });
    expect(button).toHaveClass('ai-assistant-chat__floating-action--file-upload');
  });

  // Test 46
  it('file upload button changes its accessible name while the file is being uploaded', () => {
    render(<ChatInput {...baseProps} isUploadingFile />);
    expect(screen.queryByRole('button', { name: 'ai-assistant.input.upload' })).toBeNull();
    expect(screen.getByRole('button', { name: 'ai-assistant.input.uploading' })).toBeDisabled();
  });

  // Test 47
  it('clear context button is addressable by role and name', () => {
    render(<ChatInput {...baseProps} />);
    const button = screen.getByRole('button', { name: 'ai-assistant.input.clear-context' });
    expect(button).toHaveClass('ai-assistant-chat__floating-action--clear-context');
  });

  it('keeps the visual tooltip next to the accessible name on both buttons', () => {
    const { container } = render(<ChatInput {...baseProps} />);
    const [upload, clear] = container.querySelectorAll('.ai-assistant-chat__floating-action');

    expect(upload.getAttribute('data-tooltip')).toBe('ai-assistant.input.upload');
    expect(upload.getAttribute('aria-label')).toBe('ai-assistant.input.upload');
    expect(clear.getAttribute('data-tooltip')).toBe('ai-assistant.input.clear-context');
    expect(clear.getAttribute('aria-label')).toBe('ai-assistant.input.clear-context');
  });

  it.each(['ai-assistant.input.upload', 'ai-assistant.input.uploading', 'ai-assistant.input.clear-context'])(
    'the reused key %s is translated in both locales',
    key => {
      expect(String(en[key] || '').trim()).not.toBe('');
      expect(String(ru[key] || '').trim()).not.toBe('');
    }
  );
});
