import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import FileComponent from '../FileComponent';

jest.mock('@/services/PageService', () => ({
  __esModule: true,
  default: { changeUrlLink: jest.fn() }
}));

jest.mock('@/components/dashboard/widgets/DocPreview/DocPreview', () => ({
  __esModule: true,
  default: ({ recordId }: { recordId: string }) => <div data-testid="doc-preview">{recordId}</div>
}));

import PageService from '@/services/PageService';

const RECORD = 'emodel/doc@1';
const CARD_URL = '/v2/dashboard?recordRef=emodel/doc@1';

const renderFile = (name: string) => render(<FileComponent size={10} name={name} downLoadUrl={CARD_URL} fileRecordId={RECORD} />);

describe('FileComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the image preview instead of navigating', () => {
    renderFile('photo.png');

    fireEvent.click(screen.getByText('photo.png'));

    expect(document.querySelector('.ImagePreviewModal__overlay')).not.toBeNull();
    expect(document.querySelector('.FilePreviewModal__overlay')).toBeNull();
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it('shows the media preview for a video and asks the content endpoint for it inline', () => {
    renderFile('clip.mp4');

    fireEvent.click(screen.getByText('clip.mp4'));

    const video = document.querySelector('video');

    expect(video).not.toBeNull();
    expect(video!.getAttribute('src')).toContain(`ref=${RECORD}`);
    expect(video!.getAttribute('src')).toContain('download=false');
    expect(video!.getAttribute('src')).not.toContain('download=true');
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it('shows the media preview for audio', () => {
    renderFile('song.mp3');

    fireEvent.click(screen.getByText('song.mp3'));

    expect(document.querySelector('audio')).not.toBeNull();
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it.each([['notes.md'], ['manual.pdf'], ['log.txt']])('shows %s in the modal with DocPreview for its record', name => {
    renderFile(name);

    fireEvent.click(screen.getByText(name));

    expect(document.querySelector('.FilePreviewModal__overlay')).not.toBeNull();
    expect(screen.getByTestId('doc-preview')).toHaveTextContent(RECORD);
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it('still navigates to the record card for anything the ui cannot show', () => {
    renderFile('report.docx');

    fireEvent.click(screen.getByText('report.docx'));

    expect(document.querySelector('.ImagePreviewModal__overlay')).toBeNull();
    expect(document.querySelector('.FilePreviewModal__overlay')).toBeNull();
    expect(PageService.changeUrlLink).toHaveBeenCalledWith(CARD_URL, { openNewTab: true });
  });

  it('navigates when there is no record to fetch the content from', () => {
    render(<FileComponent size={10} name="photo.png" downLoadUrl={CARD_URL} />);

    fireEvent.click(screen.getByText('photo.png'));

    expect(document.querySelector('.ImagePreviewModal__overlay')).toBeNull();
    expect(PageService.changeUrlLink).toHaveBeenCalledWith(CARD_URL, { openNewTab: true });
  });

  it.each([['clip.mp4'], ['notes.md']])('closes the preview of %s on Escape', name => {
    renderFile(name);

    fireEvent.click(screen.getByText(name));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(document.querySelector('.FilePreviewModal__overlay')).toBeNull();
  });

  it('closes the preview on a click on the backdrop', () => {
    renderFile('notes.md');

    fireEvent.click(screen.getByText('notes.md'));
    fireEvent.click(document.querySelector('.FilePreviewModal__overlay')!);

    expect(document.querySelector('.FilePreviewModal__overlay')).toBeNull();
  });
});

describe('FileComponent while the comment is being edited', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['clip.mp4', 'photo.png', 'notes.md', 'report.docx'])('keeps a plain click on %s in the editor', name => {
    render(<FileComponent size={1} name={name} downLoadUrl={CARD_URL} fileRecordId={RECORD} editable />);
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(screen.getByText(name));
    expect(document.querySelector('.FilePreviewModal__overlay, .ImagePreviewModal__overlay')).toBeNull();
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it.each(['ctrlKey', 'metaKey'])('opens an attachment explicitly with %s without leaving the draft', modifier => {
    render(<FileComponent size={1} name="clip.mp4" downLoadUrl={CARD_URL} fileRecordId={RECORD} editable />);
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(screen.getByText('clip.mp4'), { [modifier]: true });
    expect(openSpy).toHaveBeenCalledWith(CARD_URL, '_blank', 'noopener,noreferrer');
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
    expect(document.querySelector('.FilePreviewModal__overlay')).toBeNull();
    expect(screen.getByText('clip.mp4')).toBeInTheDocument();
    openSpy.mockRestore();
  });
});
