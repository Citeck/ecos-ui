import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import MarkdownViewer, { REMARK_PLUGINS } from '../MarkdownViewer';

jest.mock('@/components/common', () => ({
  InfoText: ({ text }) => <div data-testid="info-text">{text}</div>,
  Loader: () => <div data-testid="loader" />
}));

jest.mock('@/helpers/util', () => ({ t: key => key }));

const SRC = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1';

const respond = ({ status = 200, body = '', headers = {} }) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      headers: { get: name => headers[name] || null },
      text: () => Promise.resolve(body)
    })
  );
};

/**
 * `react-markdown` is mapped to a stub in `jest.config.js` (the real package is esm and nothing
 * transforms it here), so these tests say what the viewer hands the renderer and what it does
 * around it. That the rendered html is inert is a property of the plugin list, asserted below, and
 * is shown for real in the browser pass of the change.
 */
describe('MarkdownViewer', () => {
  it('does not enable raw html: that absence is the sanitisation', () => {
    const names = REMARK_PLUGINS.map(plugin => plugin.name);

    expect(names).not.toContain('rehypeRaw');
    expect(REMARK_PLUGINS).toHaveLength(1);
    expect(names).toContain('remarkGfm');
  });

  it('renders the source it loaded', async () => {
    respond({ body: '# Title\n\nsome **text**' });

    render(<MarkdownViewer src={SRC} />);

    await waitFor(() => expect(screen.getByTestId('markdown')).toBeInTheDocument());
    expect(screen.getByTestId('markdown')).toHaveTextContent('some **text**');
  });

  it('asks for a range rather than for the whole file', async () => {
    respond({ body: '# Title' });

    render(<MarkdownViewer src={SRC} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      SRC,
      expect.objectContaining({ headers: expect.objectContaining({ Range: expect.any(String) }) })
    );
  });

  it('offers the download when the file was shown only in part', async () => {
    respond({ status: 206, body: '# Title', headers: { 'Content-Range': 'bytes 0-6/9000000' } });

    render(<MarkdownViewer src={SRC} downloadData={{ link: '/download', fileName: 'notes.md' }} />);

    await waitFor(() => expect(screen.getByText('doc-preview.text.truncated')).toBeInTheDocument());
    expect(screen.getByText('doc-preview.download')).toHaveAttribute('href', '/download');
  });

  it('says nothing about a shortened file when the whole of it is shown', async () => {
    respond({ body: '# Title' });

    render(<MarkdownViewer src={SRC} downloadData={{ link: '/download', fileName: 'notes.md' }} />);

    await waitFor(() => expect(screen.getByTestId('markdown')).toBeInTheDocument());
    expect(screen.queryByText('doc-preview.text.truncated')).not.toBeInTheDocument();
  });

  it('reports a failure to load instead of rendering an empty document', async () => {
    respond({ status: 500 });
    const onError = jest.fn();

    render(<MarkdownViewer src={SRC} onError={onError} />);

    await waitFor(() => expect(screen.getByTestId('info-text')).toHaveTextContent('doc-preview.text.load-error'));
    expect(onError).toHaveBeenCalled();
  });
});
