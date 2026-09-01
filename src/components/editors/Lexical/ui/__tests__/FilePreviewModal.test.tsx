import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import FilePreviewModal from '../FilePreviewModal';

jest.mock('@/components/dashboard/widgets/DocPreview/DocPreview', () => ({
  __esModule: true,
  default: ({ recordId }: { recordId: string }) => <div data-testid="doc-preview">{recordId}</div>
}));

const SRC = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&download=false';
const RECORD = 'emodel/doc@1';

const renderModal = (kind: any, fileName: string, onClose = jest.fn()) =>
  render(<FilePreviewModal kind={kind} src={SRC} fileName={fileName} recordId={RECORD} onClose={onClose} />);

describe('FilePreviewModal renders by kind', () => {
  it('gives an image to the image viewer, with its zoom', () => {
    renderModal('image', 'photo.png');

    expect(document.querySelector('.ImagePreviewModal__overlay')).not.toBeNull();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(document.querySelector('img')!.getAttribute('src')).toEqual(SRC);
  });

  it('plays a video with controls', () => {
    const { container } = renderModal('video', 'clip.mp4');
    const video = container.querySelector('video')!;

    expect(video.getAttribute('src')).toEqual(SRC);
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('autoplay');
  });

  it('renders an audio element for audio', () => {
    const { container } = renderModal('audio', 'song.mp3');

    expect(container.querySelector('audio')).not.toBeNull();
    expect(container.querySelector('video')).toBeNull();
  });

  it.each([['pdf'], ['text'], ['markdown']])('shows a %s file with DocPreview for its record', kind => {
    renderModal(kind, `file.${kind}`);

    expect(screen.getByTestId('doc-preview')).toHaveTextContent(RECORD);
    expect(document.querySelector('.FilePreviewModal__doc')).not.toBeNull();
  });
});

describe('FilePreviewModal closes', () => {
  it.each([['video'], ['markdown']])('on a click on the backdrop but not on the content, for %s', kind => {
    const onClose = jest.fn();
    const { container } = renderModal(kind, 'file', onClose);

    fireEvent.click(container.querySelector('.FilePreviewModal__overlay')!.firstChild!);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('.FilePreviewModal__overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([['video'], ['markdown']])('on Escape, for %s', kind => {
    const onClose = jest.fn();
    renderModal(kind, 'file', onClose);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([['video'], ['markdown']])('on the close button, for %s', kind => {
    const onClose = jest.fn();
    const { getByLabelText } = renderModal(kind, 'file', onClose);

    fireEvent.click(getByLabelText('Close preview'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
