import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import AudioViewer from '../AudioViewer';
import VideoViewer from '../VideoViewer';

jest.mock('@/components/common', () => ({
  InfoText: ({ text }) => <div data-testid="info-text">{text}</div>
}));

jest.mock('@/components/common/FileIcon', () => ({ format }) => <span data-testid="file-icon" data-format={format} />);

jest.mock('@/helpers/util', () => ({ t: key => key }));

const SRC = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1';
const DOWNLOAD = { link: '/download', fileName: 'clip.mp4' };

/**
 * jsdom implements no HTMLMediaElement, so `play()` and `load()` throw and nothing here can be said
 * about playback. What can be said is what the element is handed and what happens when it reports
 * that it cannot play - the rest belongs to the browser pass of the change.
 */
describe('VideoViewer', () => {
  it('hands the url straight to the player, with controls and without preloading the file', () => {
    const { container } = render(<VideoViewer src={SRC} downloadData={DOWNLOAD} />);
    const video = container.querySelector('video');

    expect(video).toHaveAttribute('src', SRC);
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'metadata');
  });

  it('does not ask for the attachment disposition: a player ignores it anyway', () => {
    const { container } = render(<VideoViewer src={SRC} downloadData={DOWNLOAD} />);

    expect(container.querySelector('video').getAttribute('src')).not.toContain('download=');
  });

  it('offers the file for saving when the browser cannot play it', () => {
    const onError = jest.fn();
    const { container } = render(<VideoViewer src={SRC} downloadData={DOWNLOAD} onError={onError} />);

    fireEvent.error(container.querySelector('video'));

    expect(screen.getByTestId('info-text')).toHaveTextContent('doc-preview.error.media-failure');
    expect(screen.getByText('doc-preview.download')).toHaveAttribute('href', '/download');
    expect(onError).toHaveBeenCalled();
  });

  it('tries again when the document changes', () => {
    const { container, rerender } = render(<VideoViewer src={SRC} downloadData={DOWNLOAD} />);

    fireEvent.error(container.querySelector('video'));
    expect(screen.getByTestId('info-text')).toBeInTheDocument();

    rerender(<VideoViewer src={`${SRC}&att=other`} downloadData={DOWNLOAD} />);

    expect(screen.queryByTestId('info-text')).not.toBeInTheDocument();
    expect(container.querySelector('video')).toBeInTheDocument();
  });
});

describe('AudioViewer', () => {
  it('hands the url straight to the player, with controls and without preloading the file', () => {
    const { container } = render(<AudioViewer src={SRC} ext="mp3" fileName="song.mp3" />);
    const audio = container.querySelector('audio');

    expect(audio).toHaveAttribute('src', SRC);
    expect(audio).toHaveAttribute('controls');
    expect(audio).toHaveAttribute('preload', 'metadata');
  });

  it('says what is playing, since a player bar on its own says nothing', () => {
    render(<AudioViewer src={SRC} ext="mp3" fileName="song.mp3" />);

    expect(screen.getByText('song.mp3')).toBeInTheDocument();
    expect(screen.getByTestId('file-icon')).toHaveAttribute('data-format', 'mp3');
  });

  it('falls back to the name the download is offered under', () => {
    render(<AudioViewer src={SRC} ext="mp3" downloadData={{ link: '/download', fileName: 'from-download.mp3' }} />);

    expect(screen.getByText('from-download.mp3')).toBeInTheDocument();
  });

  it('offers the file for saving when the browser cannot play it', () => {
    const onError = jest.fn();
    const { container } = render(
      <AudioViewer src={SRC} ext="mp3" downloadData={{ link: '/download', fileName: 'song.mp3' }} onError={onError} />
    );

    fireEvent.error(container.querySelector('audio'));

    expect(screen.getByTestId('info-text')).toHaveTextContent('doc-preview.error.media-failure');
    expect(screen.getByText('doc-preview.download')).toHaveAttribute('href', '/download');
    expect(onError).toHaveBeenCalled();
  });
});
