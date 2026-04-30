import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import TextViewer from '../TextViewer';

jest.mock('../../../common', () => ({
  InfoText: ({ text }) => <span data-testid="info-text">{text}</span>,
  Loader: () => <div data-testid="loader" />
}));

jest.mock('../../../common/btns', () => ({
  Btn: ({ children, ...rest }) => <button {...rest}>{children}</button>
}));

jest.mock('@/helpers/util', () => ({
  t: key => key
}));

const TEST_MAX_BYTES = 500 * 1024;

jest.mock('@/constants', () => ({
  DocScaleOptions: { AUTO: 'auto', PAGE_WIDTH: 'page-width' },
  DOC_PREVIEW_TEXT_MAX_BYTES: 500 * 1024
}));

describe('TextViewer', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  function mockFetchText(content) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(content)
    });
  }

  function mockFetchError(message = 'network') {
    global.fetch = jest.fn().mockRejectedValue(new Error(message));
  }

  it('renders loader while fetching', () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(<TextViewer src="http://example/file.log" settings={{ scale: 1 }} />);
    expect(screen.getByTestId('loader')).toBeTruthy();
  });

  it('renders fetched content in pre tag', async () => {
    mockFetchText('hello\nworld');
    const { container } = render(<TextViewer src="http://example/file.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(container.querySelector('pre')).toBeTruthy());
    expect(container.querySelector('pre').textContent).toEqual('hello\nworld');
  });

  it('shows truncation banner when content exceeds max size', async () => {
    const oversize = 'x'.repeat(TEST_MAX_BYTES + 100);
    mockFetchText(oversize);

    render(
      <TextViewer
        src="http://example/huge.log"
        settings={{ scale: 1 }}
        downloadData={{ link: 'http://example/huge.log', fileName: 'huge.log' }}
      />
    );

    await waitFor(() => expect(screen.getByText('doc-preview.text.truncated')).toBeTruthy());
  });

  it('renders only first MAX_PREVIEW_BYTES when truncated', async () => {
    const oversize = 'x'.repeat(TEST_MAX_BYTES + 500);
    mockFetchText(oversize);

    const { container } = render(<TextViewer src="http://example/huge.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(container.querySelector('pre')).toBeTruthy());
    // ASCII content: 1 char == 1 byte, so text length equals byte limit
    expect(container.querySelector('pre').textContent.length).toEqual(TEST_MAX_BYTES);
  });

  it('truncates by bytes, not characters, for multi-byte UTF-8 content', async () => {
    // Each "€" is 3 bytes in UTF-8. Build content large enough to exceed the byte limit.
    const charsToOverflow = Math.ceil(TEST_MAX_BYTES / 3) + 100;
    const oversize = '€'.repeat(charsToOverflow);
    mockFetchText(oversize);

    const { container } = render(<TextViewer src="http://example/unicode.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(container.querySelector('pre')).toBeTruthy());
    const rendered = container.querySelector('pre').textContent;
    const renderedBytes = new TextEncoder().encode(rendered).length;
    expect(renderedBytes).toBeLessThanOrEqual(TEST_MAX_BYTES);
    // Character count is smaller than byte limit when each char is multi-byte
    expect(rendered.length).toBeLessThan(TEST_MAX_BYTES);
    expect(screen.getByText('doc-preview.text.truncated')).toBeTruthy();
  });

  it('renders error message when fetch fails', async () => {
    mockFetchError();
    render(<TextViewer src="http://example/broken.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(screen.getByText('doc-preview.text.load-error')).toBeTruthy());
  });

  it('applies font-size derived from settings.scale', async () => {
    mockFetchText('hello');
    const { container } = render(<TextViewer src="http://example/file.log" settings={{ scale: 2 }} />);

    await waitFor(() => expect(container.querySelector('pre')).toBeTruthy());
    expect(container.querySelector('pre').style.fontSize).toEqual('26px');
  });

  it('re-fetches content when src prop changes', async () => {
    mockFetchText('first');
    const { container, rerender } = render(<TextViewer src="http://example/a.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(container.querySelector('pre').textContent).toEqual('first'));

    mockFetchText('second');
    rerender(<TextViewer src="http://example/b.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(container.querySelector('pre').textContent).toEqual('second'));
  });

  it('calls onCentered after successful render', async () => {
    mockFetchText('abc');
    const onCentered = jest.fn();
    render(<TextViewer src="http://example/a.log" settings={{ scale: 1 }} onCentered={onCentered} />);

    await waitFor(() => expect(onCentered).toHaveBeenCalled());
  });

  it('calls onError on fetch failure', async () => {
    mockFetchError();
    const onError = jest.fn();
    render(<TextViewer src="http://example/broken.log" settings={{ scale: 1 }} onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it('wraps long lines by default and toggles to no-wrap via checkbox', async () => {
    mockFetchText('hello world');
    const { container } = render(<TextViewer src="http://example/a.log" settings={{ scale: 1 }} />);

    await waitFor(() => expect(container.querySelector('pre')).toBeTruthy());

    const pre = container.querySelector('pre');
    expect(pre.className).toContain('ecos-doc-preview__viewer-page-content_text-wrap');

    const toggle = container.querySelector('.ecos-doc-preview__viewer-page_text-wrap-toggle');
    expect(toggle).toBeTruthy();

    fireEvent.click(toggle);

    expect(pre.className).toContain('ecos-doc-preview__viewer-page-content_text-nowrap');
    expect(pre.className).not.toContain('ecos-doc-preview__viewer-page-content_text-wrap');
  });
});
