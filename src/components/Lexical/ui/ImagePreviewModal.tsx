import './ImagePreviewModal.css';

import { type MouseEvent, JSX, useCallback, useEffect, useMemo } from 'react';

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
    (event: MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const imageUrl = useMemo(() => {
    if (src.includes('/api/ecos/webapp/content')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}download=false`;
    }
    return src;
  }, [src]);

  return (
    <div className="ImagePreviewModal__overlay" onClick={onOverlayClick}>
      <img className="ImagePreviewModal__image" src={imageUrl} alt={altText} />
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
