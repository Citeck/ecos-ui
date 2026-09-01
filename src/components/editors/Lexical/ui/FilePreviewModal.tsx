import './FilePreviewModal.css';

import React, { type MouseEvent, JSX, useCallback, useEffect } from 'react';

import ImagePreviewModal from './ImagePreviewModal';

import DocPreview from '@/components/dashboard/widgets/DocPreview/DocPreview';

/** Everything this ui can render; `none` has nothing to show and goes to the record card instead. */
export type FilePreviewKind = 'image' | 'pdf' | 'text' | 'markdown' | 'video' | 'audio';

type Props = {
  /** what to render `src` with, see {@link previewKindByFileName} */
  kind: FilePreviewKind;
  /** the bytes of the file, used by the players and the image; a document is fetched by record */
  src: string;
  fileName: string;
  /** the record the file lives on, the only thing `DocPreview` needs */
  recordId: string;
  onClose: () => void;
};

/**
 * The one modal a file attached to a comment opens in. Zoom and pan belong to the image viewer,
 * which owns its overlay too, so an image is delegated to it whole; everything else shares the
 * overlay below.
 */
export default function FilePreviewModal({ kind, src, fileName, recordId, onClose }: Props): JSX.Element {
  if (kind === 'image') {
    return <ImagePreviewModal src={src} altText={fileName} onClose={onClose} />;
  }

  return <PreviewOverlay kind={kind} src={src} fileName={fileName} recordId={recordId} onClose={onClose} />;
}

function PreviewOverlay({ kind, src, fileName, recordId, onClose }: Props): JSX.Element {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const onOverlayClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className="FilePreviewModal__overlay" onClick={onOverlayClick}>
      {kind === 'video' || kind === 'audio' ? (
        <Media kind={kind} src={src} fileName={fileName} />
      ) : (
        // `DocPreview` measures its container, so the box around it has to have a height of its own
        <div className="FilePreviewModal__doc">
          <DocPreview recordId={recordId} height="100%" className="FilePreviewModal__docPreview" />
        </div>
      )}

      <button className="FilePreviewModal__closeButton" aria-label="Close preview" type="button" onClick={onClose}>
        &#x2715;
      </button>
    </div>
  );
}

function Media({ kind, src, fileName }: { kind: 'video' | 'audio'; src: string; fileName: string }): JSX.Element {
  const Player = kind === 'audio' ? 'audio' : 'video';

  return (
    <Player
      className={`FilePreviewModal__media FilePreviewModal__media--${kind}`}
      src={src}
      title={fileName}
      controls
      autoPlay
      controlsList="nodownload"
    />
  );
}
