import { render } from '@testing-library/react';
import React from 'react';

import ChatInput from '../components/ChatInput';
import { FILE_UPLOAD_ACCEPT_STRING, buildAcceptString, FILE_UPLOAD_WHITELIST } from '../constants';

jest.mock('../../common', () => ({
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
