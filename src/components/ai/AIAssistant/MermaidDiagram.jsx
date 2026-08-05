import React, { useEffect, useRef, useState, memo, useCallback } from 'react';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';
import ESMRequire from '@/services/ESMRequire';
import { NotificationManager } from '@/services/notifications';

// Mermaid library version
const MERMAID_VERSION = '11.12.0';

// Use a more persistent way to track initialization
const MERMAID_INIT_KEY = 'mermaid-initialized-flag';
const MERMAID_INSTANCE_KEY = 'mermaid-instance';

const isMermaidInitialized = () => {
  return window[MERMAID_INIT_KEY] === true;
};

const setMermaidInitialized = () => {
  window[MERMAID_INIT_KEY] = true;
};

const getMermaidInstance = () => {
  return window[MERMAID_INSTANCE_KEY];
};

const setMermaidInstance = instance => {
  window[MERMAID_INSTANCE_KEY] = instance;
};

// The mermaid instance is a process-wide singleton, so `initialize` is global state, not per-render
// options. The fullscreen render below has to reconfigure it and then put this back — otherwise
// every diagram rendered afterwards inherits `useMaxWidth: false` and the viewport-scaled spacing,
// and since the inline SVG is now drawn at its natural width it comes out thousands of px wide in a
// 438px chat panel.
const INLINE_MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 12,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'cardinal',
    padding: 30,
    nodeSpacing: 80,
    rankSpacing: 60,
    wrappingWidth: 200
  },
  sequence: {
    useMaxWidth: true,
    wrap: true,
    diagramMarginX: 20,
    diagramMarginY: 20,
    boxMargin: 12,
    boxTextMargin: 8,
    noteMargin: 12
  },
  gantt: {
    useMaxWidth: true,
    fontSize: 14,
    fontFamily: 'inherit'
  },
  er: {
    useMaxWidth: true,
    fontSize: 14
  },
  gitGraph: {
    useMaxWidth: true
  }
};

// The fullscreen wrapper animates `transform` (0.2s), so a rect measured during that animation
// reports the interpolated scale rather than the target zoom. Read the scale actually applied.
const readAppliedScale = element => {
  const transform = element && window.getComputedStyle(element)?.transform;

  if (!transform || transform === 'none') {
    return null;
  }

  const matrix = transform.match(/^matrix\(\s*([^,]+),/);
  if (matrix) {
    return parseFloat(matrix[1]) || null;
  }

  const scale = transform.match(/^scale\(\s*([^,)]+)/);
  return scale ? parseFloat(scale[1]) || null : null;
};

// Canvas has a per-browser area/edge cap; past it `toBlob` hands back null. The inline SVG is drawn
// at natural size now, so a large flowchart reaches that cap where the old panel-width export never did.
const MAX_EXPORT_EDGE = 8192;

const MermaidDiagram = ({ chart, className = '' }) => {
  const elementRef = useRef(null);
  const fullscreenRef = useRef(null);
  // Zoom that makes the whole diagram fit the fullscreen modal; also what the "fit" button returns to
  const fitZoomRef = useRef(1);
  // Current zoom, readable from callbacks without making them depend on it
  const zoomRef = useRef(1);
  const [svgContent, setSvgContent] = useState('');
  const [fullscreenSvgContent, setFullscreenSvgContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRendering, setIsRendering] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  // Lazy load mermaid library
  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Check if already loaded
        if (getMermaidInstance()) {
          setMermaidLoaded(true);
          return;
        }

        // Load mermaid from local library using ESMRequire
        ESMRequire.require([`/js/lib/mermaid/${MERMAID_VERSION}/mermaid.min.js`], mermaid => {
          if (!mermaid || typeof mermaid.initialize !== 'function') {
            throw new Error('Mermaid library not loaded correctly');
          }

          // Initialize mermaid
          if (!isMermaidInitialized()) {
            mermaid.initialize(INLINE_MERMAID_CONFIG);
            setMermaidInitialized();
          }

          // Store instance globally
          setMermaidInstance(mermaid);
          setMermaidLoaded(true);
        });
      } catch (error) {
        console.error('Failed to load Mermaid library:', error);
        console.error('Error details:', error.message, error.stack);
        setErrorMessage('Failed to load diagram library: ' + error.message);
        setIsRendering(false);
      }
    };

    loadMermaid();
  }, []);

  const renderDiagram = useCallback(async () => {
    if (!chart) {
      setIsRendering(false);
      setSvgContent('');
      setErrorMessage('');
      return;
    }

    // Wait for mermaid to be loaded
    const mermaid = getMermaidInstance();
    if (!mermaid) {
      return;
    }

    setIsRendering(true);
    setErrorMessage('');
    setSvgContent('');

    try {
      // Generate unique ID for this diagram
      const id = `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;

      // Validate and render the diagram
      const { svg } = await mermaid.render(id, chart.trim());

      // Set the SVG content
      setSvgContent(svg);
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsRendering(false);
    }
  }, [chart]);

  // Render diagram optimized for fullscreen
  const renderFullscreenDiagram = useCallback(async () => {
    if (!chart) return null;

    // Wait for mermaid to be loaded
    const mermaid = getMermaidInstance();
    if (!mermaid) {
      return null;
    }

    try {
      // Get viewport dimensions for fullscreen rendering
      const viewportWidth = window.innerWidth - 80; // Account for side padding
      const viewportHeight = window.innerHeight - 160; // Account for header (60px) + content padding (100px)

      // Create fullscreen-optimized config
      const fullscreenConfig = {
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 16, // Larger font for fullscreen
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'cardinal',
          padding: 40,
          nodeSpacing: Math.max(100, viewportWidth * 0.08), // Responsive spacing
          rankSpacing: Math.max(80, viewportHeight * 0.08),
          wrappingWidth: Math.max(300, viewportWidth * 0.2) // Responsive width
        },
        sequence: {
          useMaxWidth: false,
          wrap: true,
          diagramMarginX: Math.max(30, viewportWidth * 0.02),
          diagramMarginY: Math.max(30, viewportHeight * 0.03),
          boxMargin: 20,
          boxTextMargin: 12,
          noteMargin: 15
        },
        gantt: {
          useMaxWidth: false,
          fontSize: 16,
          barHeight: 30
        },
        er: {
          useMaxWidth: false,
          fontSize: 16
        },
        gitGraph: {
          useMaxWidth: false
        }
      };

      // Initialize with fullscreen config
      mermaid.initialize(fullscreenConfig);

      try {
        // Render with unique ID
        const id = `fullscreen-diagram-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());

        return svg;
      } finally {
        // Hand the shared instance back the inline config — see INLINE_MERMAID_CONFIG
        mermaid.initialize(INLINE_MERMAID_CONFIG);
      }
    } catch (error) {
      console.error('Fullscreen rendering error:', error);
      return null;
    }
  }, [chart]);

  useEffect(() => {
    // Only render when mermaid is loaded
    if (mermaidLoaded) {
      renderDiagram();
    }
  }, [renderDiagram, mermaidLoaded]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    setIsFullscreen(prev => {
      if (!prev) {
        // Opening fullscreen - render fullscreen version; the zoom that fits the window is measured
        // once the SVG is in the DOM (see the fit effect below)
        setZoom(1);
        renderFullscreenDiagram().then(fullscreenSvg => {
          if (fullscreenSvg) {
            setFullscreenSvgContent(fullscreenSvg);
          }
        });
      } else {
        // Closing fullscreen - clear fullscreen content
        setFullscreenSvgContent('');
      }
      return !prev;
    });
  }, [renderFullscreenDiagram]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  // Zoom at which the whole diagram fits the modal. "100 %" is the diagram's natural size, which for
  // a large flowchart is far too small to read — opening fullscreen at 1 forced everyone to zoom in
  // by hand (D-B-10). Measured once the fullscreen SVG is in the DOM, and reused by "fit".
  const measureFitZoom = useCallback(() => {
    const svgElement = fullscreenRef.current?.querySelector('svg');
    const container = fullscreenRef.current?.closest('.mermaid-fullscreen-modal__content');

    if (!svgElement || !container) {
      return 1;
    }

    // Measure what is actually laid out, with the wrapper's current scale divided back out. The
    // viewBox would be wrong here: mermaid already sizes the fullscreen SVG to the modal, so a
    // viewBox-based factor shrank an already-fitted diagram a second time.
    //
    // The scale comes from the DOM, not from `zoomRef`: this effect can re-run while the wrapper is
    // still animating towards the previous `setZoom`, and dividing a mid-transition rect by the
    // target zoom stores a fit value that "Вписать" then returns to forever.
    const wrapper = fullscreenRef.current?.closest('.mermaid-diagram-content');
    const zoomInEffect = readAppliedScale(wrapper) || zoomRef.current || 1;
    const svgRect = svgElement.getBoundingClientRect();
    const layoutWidth = svgRect.width / zoomInEffect;
    const layoutHeight = svgRect.height / zoomInEffect;
    const available = container.getBoundingClientRect();

    if (!layoutWidth || !layoutHeight || !available.width || !available.height) {
      return 1;
    }

    const fit = Math.min(available.width / layoutWidth, available.height / layoutHeight);

    // Same bounds as the zoom buttons, so "fit" never lands on a value they cannot return to
    return Math.min(Math.max(fit, 0.25), 5);
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!isFullscreen || !fullscreenSvgContent) {
      return;
    }

    // One frame later: the SVG has just been written via dangerouslySetInnerHTML
    const frameId = requestAnimationFrame(() => {
      const fit = measureFitZoom();
      fitZoomRef.current = fit;
      setZoom(fit);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isFullscreen, fullscreenSvgContent, measureFitZoom]);

  const resetZoom = useCallback(() => {
    setZoom(fitZoomRef.current || 1);
  }, []);

  // PNG export function - direct SVG to Canvas conversion
  const downloadPNG = useCallback(async () => {
    if (!svgContent || !elementRef.current) return;

    try {
      // Direct SVG to Canvas conversion
      const svgElement = elementRef.current.querySelector('svg');
      if (!svgElement) {
        NotificationManager.error('SVG element not found');
        return;
      }

      // Get SVG dimensions
      const svgRect = svgElement.getBoundingClientRect();
      const svgWidth = Math.max(svgRect.width, 800);
      const svgHeight = Math.max(svgRect.height, 600);

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 2x for a crisp export, but only as far as the canvas cap allows: the inline SVG is drawn at
      // natural size now, so a wide flowchart would otherwise ask for a canvas the browser refuses
      // to allocate and `toBlob` would silently yield null.
      const scale = Math.min(2, MAX_EXPORT_EDGE / svgWidth, MAX_EXPORT_EDGE / svgHeight);

      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      ctx.scale(scale, scale);

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, svgWidth, svgHeight);

      // Convert SVG to image with proper styling
      const svgClone = svgElement.cloneNode(true);
      svgClone.setAttribute('width', svgWidth);
      svgClone.setAttribute('height', svgHeight);
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Get all computed styles and embed them
      const allElements = svgClone.querySelectorAll('*');
      allElements.forEach((element, index) => {
        const originalElement = svgElement.querySelectorAll('*')[index];
        if (originalElement) {
          const computedStyle = window.getComputedStyle(originalElement);
          let styleStr = '';
          for (let i = 0; i < computedStyle.length; i++) {
            const prop = computedStyle[i];
            styleStr += `${prop}:${computedStyle.getPropertyValue(prop)};`;
          }
          element.setAttribute('style', styleStr);
        }
      });

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

        // Download
        canvas.toBlob(
          pngBlob => {
            // Null when the browser refused the canvas — reported, not thrown into an async
            // callback the try/catch below can never see
            if (!pngBlob) {
              NotificationManager.error(t('ai-assistant.mermaid.export-error'));
              return;
            }

            const pngUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'diagram.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
          },
          'image/png',
          0.95
        );
      };

      img.onerror = error => {
        console.error('SVG to PNG conversion failed:', error);
        NotificationManager.error(t('ai-assistant.mermaid.export-error') + ' ' + error.message);
      };

      img.src = dataUrl;
    } catch (error) {
      console.error('PNG export error:', error);
      NotificationManager.error(t('ai-assistant.mermaid.export-error') + ' ' + error.message);
    }
  }, [svgContent]);

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setZoom(1);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (svgContent && elementRef.current) {
      // Apply responsive styles to SVG
      const svgElement = elementRef.current.querySelector('svg');
      if (svgElement) {
        // Mermaid draws into a viewBox, so `width: 100%` scales the WHOLE diagram to the chat width
        // while `min-width: 700px` (which beats `max-width: 100%`) keeps it overflowing anyway — a
        // 12-node flowchart came out squeezed with unreadable labels (D-B-10). Draw at natural size
        // and let the container scroll instead of shrinking the picture.
        const viewBoxWidth = svgElement.viewBox?.baseVal?.width || 0;

        svgElement.style.maxWidth = 'none';
        svgElement.style.minWidth = '0';
        svgElement.style.height = 'auto';
        svgElement.style.width = viewBoxWidth ? `${Math.round(viewBoxWidth)}px` : 'auto';
      }
    }
  }, [svgContent]);

  const renderDiagramContent = (ref, isFullscreenMode = false) => (
    <div
      className={`mermaid-diagram-content ${isFullscreenMode ? 'mermaid-diagram-content--fullscreen' : ''}`}
      style={{
        minHeight: isRendering || !mermaidLoaded ? '50px' : 'auto',
        display: 'flex',
        alignItems: isRendering || !mermaidLoaded ? 'center' : 'stretch',
        justifyContent: isRendering || !mermaidLoaded ? 'center' : 'stretch',
        transform: isFullscreenMode ? `scale(${zoom})` : 'none',
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      {!mermaidLoaded && <div style={{ color: '#666', fontSize: '14px' }}>Loading diagram library...</div>}
      {mermaidLoaded && isRendering && <div style={{ color: '#666', fontSize: '14px' }}>Rendering diagram...</div>}
      {mermaidLoaded && !isRendering && errorMessage && (
        <div className="mermaid-error">
          <strong>Mermaid Diagram Error:</strong>
          <pre>{errorMessage}</pre>
        </div>
      )}
      {mermaidLoaded && !isRendering && svgContent && !errorMessage && (
        <div
          ref={ref}
          dangerouslySetInnerHTML={{
            __html: isFullscreenMode && fullscreenSvgContent ? fullscreenSvgContent : svgContent
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <div className={`mermaid-diagram ${className}`}>
        {/* Control buttons */}
        {mermaidLoaded && !isRendering && svgContent && !errorMessage && (
          <div className="mermaid-diagram__controls">
            <button className="mermaid-diagram__control-btn" onClick={downloadPNG} title={t('ai-assistant.mermaid.download-png')}>
              <Icon className="fa fa-download" />
            </button>
            <button className="mermaid-diagram__control-btn" onClick={toggleFullscreen} title={t('ai-assistant.mermaid.fullscreen')}>
              <Icon className="fa fa-expand" />
            </button>
          </div>
        )}

        {/* Regular diagram view */}
        {renderDiagramContent(elementRef)}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="mermaid-fullscreen-modal">
          <div className="mermaid-fullscreen-modal__header">
            <div className="mermaid-fullscreen-modal__zoom-controls">
              <div className="mermaid-fullscreen-modal__zoom-group">
                <button
                  className="mermaid-fullscreen-modal__control-btn"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.25}
                  title={t('ai-assistant.mermaid.zoom-out')}
                >
                  <Icon className="fa fa-search-minus" />
                </button>
                <span className="mermaid-fullscreen-modal__zoom-level">{Math.round(zoom * 100)}%</span>
                <button
                  className="mermaid-fullscreen-modal__control-btn"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  title={t('ai-assistant.mermaid.zoom-in')}
                >
                  <Icon className="fa fa-search-plus" />
                </button>
              </div>
              <button className="mermaid-fullscreen-modal__control-btn" onClick={resetZoom} title={t('ai-assistant.mermaid.fit')}>
                <Icon className="fa fa-arrows-alt" />
              </button>
            </div>

            <div className="mermaid-fullscreen-modal__actions">
              <button
                className="mermaid-fullscreen-modal__control-btn"
                onClick={downloadPNG}
                title={t('ai-assistant.mermaid.download-png')}
              >
                <Icon className="fa fa-download" />
              </button>
              <button
                className="mermaid-fullscreen-modal__control-btn mermaid-fullscreen-modal__close-btn"
                onClick={toggleFullscreen}
                title={t('ai-assistant.mermaid.close')}
              >
                <Icon className="fa fa-times" />
              </button>
            </div>
          </div>

          <div className="mermaid-fullscreen-modal__content">{renderDiagramContent(fullscreenRef, true)}</div>
        </div>
      )}
    </>
  );
};

export default memo(MermaidDiagram);
