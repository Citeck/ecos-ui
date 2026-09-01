import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { DocPreviewApi, normalizePreviewInfo } from '@/api/docPreview';

import DocPreview from '../DocPreview';

jest.mock('@/api/docPreview', () => {
  const actual = jest.requireActual('@/api/docPreview');

  return {
    ...actual,
    DocPreviewApi: { getPreview: jest.fn(), getPreviews: jest.fn() }
  };
});

jest.mock('@/helpers/util', () => ({
  ...jest.requireActual('@/helpers/util'),
  t: key => key
}));

const RECORD = 'emodel/doc@1';

const previewOf = (info, options = {}) => normalizePreviewInfo(info, { recordRef: RECORD, hasContent: true, ...options });

const answerWith = preview => {
  DocPreviewApi.getPreview.mockResolvedValue(preview);
  DocPreviewApi.getPreviews.mockResolvedValue([]);
};

const renderPreview = () => render(<DocPreview recordId={RECORD} />);

describe('DocPreview: a record with no preview says why', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it.each([
    ['unsupported', 'doc-preview.status.unsupported'],
    ['failed', 'doc-preview.status.failed'],
    ['processing', 'doc-preview.status.processing']
  ])('shows the reason the backend gave for a %s preview', async (status, label) => {
    answerWith(previewOf({ kind: 'none', status, originalUrl: '/content?ref=emodel/doc@1', originalName: 'archive.zip' }));

    renderPreview();

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('offers the file even though it cannot show it', async () => {
    answerWith(previewOf({ kind: 'none', status: 'unsupported', originalUrl: '/content?ref=emodel/doc@1', originalName: 'archive.zip' }));

    renderPreview();

    await screen.findByText('doc-preview.status.unsupported');
    expect(screen.getByText('doc-preview.download').closest('a')).toHaveAttribute('download', 'archive.zip');
  });

  /**
   * The old behaviour, and the reason this is worth a test: a record that holds nothing must keep
   * saying so rather than offering a link to nowhere.
   */
  it('still says there is no document when the record holds nothing', async () => {
    answerWith(previewOf(null, { hasContent: false }));

    renderPreview();

    expect(await screen.findByText('doc-preview.error.no-document')).toBeInTheDocument();
    expect(screen.queryByText('doc-preview.download')).not.toBeInTheDocument();
  });
});

describe('DocPreview: waiting for a preview that is being prepared', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // the microtask queue must stay real, or nothing awaited here ever resolves
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
  });

  afterEach(() => jest.useRealTimers());

  const processing = () => previewOf({ kind: 'none', status: 'processing', originalUrl: '/content?ref=emodel/doc@1' });
  const ready = () => previewOf({ kind: 'image', status: 'ready', url: '/content?ref=emodel/doc@1', mimeType: 'image/png', ext: 'png' });

  /**
   * One pass is two awaited requests and a couple of setState callbacks, so the microtask queue has
   * to be drained - inside `act`, or react holds the resulting render back and the timer of the
   * next pass is never scheduled - before the next timer is due.
   */
  const flush = async () =>
    act(async () => {
      for (let i = 0; i < 40; i++) {
        await Promise.resolve();
      }
    });

  const advance = async ms => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
    await flush();
  };

  it('asks again until the preview is ready', async () => {
    DocPreviewApi.getPreviews.mockResolvedValue([]);
    DocPreviewApi.getPreview.mockResolvedValueOnce(processing()).mockResolvedValue(ready());

    renderPreview();
    await advance(0);

    expect(DocPreviewApi.getPreview).toHaveBeenCalledTimes(1);

    await advance(3000);

    expect(DocPreviewApi.getPreview).toHaveBeenCalledTimes(2);

    // ready now, so nothing is scheduled any more
    await advance(60000);

    expect(DocPreviewApi.getPreview).toHaveBeenCalledTimes(2);
  });

  /**
   * Asking again is only half of it: the answer has to reach the screen. The document has not
   * changed, so nothing about it being a different document can be what triggers the redraw.
   */
  it('shows the preview once it is ready, without the reader touching anything', async () => {
    DocPreviewApi.getPreviews.mockResolvedValue([]);
    DocPreviewApi.getPreview.mockResolvedValueOnce(processing()).mockResolvedValue(ready());

    const { container } = renderPreview();
    await advance(0);

    expect(screen.getByText('doc-preview.status.processing')).toBeInTheDocument();

    await advance(3000);

    expect(screen.queryByText('doc-preview.status.processing')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('stops asking after about two minutes and hands the reader the button', async () => {
    DocPreviewApi.getPreviews.mockResolvedValue([]);
    DocPreviewApi.getPreview.mockResolvedValue(processing());

    renderPreview();
    await advance(0);

    for (let i = 0; i < 20; i++) {
      await advance(10000);
    }

    const callsWhenExhausted = DocPreviewApi.getPreview.mock.calls.length;
    expect(callsWhenExhausted).toBeLessThanOrEqual(17);
    expect(await screen.findByText('doc-preview.refresh')).toBeInTheDocument();

    await advance(120000);

    expect(DocPreviewApi.getPreview).toHaveBeenCalledTimes(callsWhenExhausted);
  });

  it('asks once more when the reader presses the button', async () => {
    DocPreviewApi.getPreviews.mockResolvedValue([]);
    DocPreviewApi.getPreview.mockResolvedValue(processing());

    renderPreview();
    await advance(0);

    for (let i = 0; i < 20; i++) {
      await advance(10000);
    }

    const before = DocPreviewApi.getPreview.mock.calls.length;
    fireEvent.click(await screen.findByText('doc-preview.refresh'));
    await flush();

    expect(DocPreviewApi.getPreview.mock.calls.length).toBeGreaterThan(before);
  });
});

describe('DocPreview: choosing a viewer by kind', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('plays a video instead of trying to draw it', async () => {
    answerWith(previewOf({ kind: 'video', status: 'ready', url: '/content?ref=emodel/doc@1', mimeType: 'video/mp4', ext: 'mp4' }));

    const { container } = renderPreview();

    await waitFor(() => expect(container.querySelector('video')).toBeInTheDocument());
  });

  it('plays an audio file instead of trying to draw it', async () => {
    answerWith(previewOf({ kind: 'audio', status: 'ready', url: '/content?ref=emodel/doc@1', mimeType: 'audio/mpeg', ext: 'mp3' }));

    const { container } = renderPreview();

    await waitFor(() => expect(container.querySelector('audio')).toBeInTheDocument());
  });
});

describe('DocPreview: a player put fullscreen by its own controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
  });

  const enterFullscreen = element => {
    Object.defineProperty(document, 'fullscreenElement', { value: element, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
  };

  // A fullscreen element leaves the flow, so the measured body height collapses and the widget
  // would hide itself - taking the fullscreen player with it, since `visibility` is inherited.
  it('keeps the widget visible while the player is fullscreen', async () => {
    answerWith(previewOf({ kind: 'video', status: 'ready', url: '/content?ref=emodel/doc@1', mimeType: 'video/mp4', ext: 'mp4' }));

    const { container } = renderPreview();

    await waitFor(() => expect(container.querySelector('video')).toBeInTheDocument());

    enterFullscreen(container.querySelector('video'));

    expect(container.querySelector('.ecos-doc-preview')).not.toHaveClass('ecos-doc-preview_hidden');
  });

  it('measures the widget again once the player leaves fullscreen', async () => {
    answerWith(previewOf({ kind: 'video', status: 'ready', url: '/content?ref=emodel/doc@1', mimeType: 'video/mp4', ext: 'mp4' }));

    const { container } = renderPreview();

    await waitFor(() => expect(container.querySelector('video')).toBeInTheDocument());

    enterFullscreen(container.querySelector('video'));
    enterFullscreen(null);

    expect(container.querySelector('.ecos-doc-preview')).toHaveClass('ecos-doc-preview_hidden');
  });
});
