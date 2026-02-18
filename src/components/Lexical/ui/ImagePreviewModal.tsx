import './ImagePreviewModal.css';

import { JSX, useCallback, useEffect } from 'react';

export default function ImagePreviewModal({
  src,
  altText,
  onClose
}: {
  src: string;
  altText: string;
  onClose: () => void;
}): JSX.Element {
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
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className="ImagePreviewModal__overlay" onClick={onOverlayClick}>
      <img className="ImagePreviewModal__image" src={src} alt={altText} />
      <button
        className="ImagePreviewModal__closeButton"
        aria-label="Close preview"
        type="button"
        onClick={onClose}
      >
        &#x2715;
      </button>
    </div>
  );
}
