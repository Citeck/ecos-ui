import './ImagePreviewModal.css';

import { type MouseEvent, type WheelEvent, JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;

export default function ImagePreviewModal({
  src,
  altText,
  onClose
}: {
  src: string;
  altText: string;
  onClose: () => void;
}): JSX.Element {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; offsetX: number; offsetY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const didDragRef = useRef(false);

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

  useEffect(() => {
    const onMouseMove = (event: globalThis.MouseEvent) => {
      if (!dragRef.current.dragging) {
        return;
      }
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        didDragRef.current = true;
      }
      setOffset({
        x: dragRef.current.offsetX + dx,
        y: dragRef.current.offsetY + dy
      });
    };

    const onMouseUp = () => {
      dragRef.current.dragging = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onImageMouseDown = useCallback(
    (event: MouseEvent) => {
      if (scale <= 1) {
        return;
      }
      event.preventDefault();
      didDragRef.current = false;
      setIsDragging(true);
      dragRef.current = {
        dragging: true,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: offset.x,
        offsetY: offset.y
      };
    },
    [scale, offset]
  );

  const onOverlayClick = useCallback(
    (event: MouseEvent) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
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

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(prev - SCALE_STEP, MIN_SCALE);
      if (next <= 1) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    setScale(prev => {
      const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      const next = Math.min(Math.max(prev + delta, MIN_SCALE), MAX_SCALE);
      if (next <= 1) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const scalePercent = Math.round(scale * 100);
  const isPannable = scale > 1;

  return (
    <div className="ImagePreviewModal__overlay" onClick={onOverlayClick} onWheel={onWheel}>
      <img
        className={`ImagePreviewModal__image${isPannable ? ' ImagePreviewModal__image--pannable' : ''}`}
        src={imageUrl}
        alt={altText}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : undefined
        }}
        onMouseDown={onImageMouseDown}
        draggable={false}
      />

      <div className="ImagePreviewModal__toolbar">
        <button
          className="ImagePreviewModal__toolbarButton"
          type="button"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
        >
          &#x2212;
        </button>

        <button
          className="ImagePreviewModal__scaleLabel"
          type="button"
          onClick={resetZoom}
          aria-label="Reset zoom"
        >
          {scalePercent}%
        </button>

        <button
          className="ImagePreviewModal__toolbarButton"
          type="button"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
        >
          &#x2b;
        </button>
      </div>

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
