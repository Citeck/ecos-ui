import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import mermaid from 'mermaid';
import { Icon } from '../common';
import { NotificationManager } from '../../services/notifications';

// Use a more persistent way to track initialization
const MERMAID_INIT_KEY = 'mermaid-initialized-flag';

const isMermaidInitialized = () => {
  return window[MERMAID_INIT_KEY] === true;
};

const setMermaidInitialized = () => {
  window[MERMAID_INIT_KEY] = true;
};

const MermaidDiagram = ({ chart, className = '' }) => {
  const elementRef = useRef(null);
  const fullscreenRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [fullscreenSvgContent, setFullscreenSvgContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRendering, setIsRendering] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isMermaidInitialized()) {
      mermaid.initialize({
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
      });
      setMermaidInitialized();
    }
  }, []);

  const renderDiagram = useCallback(async () => {
    if (!chart) {
      setIsRendering(false);
      setSvgContent('');
      setErrorMessage('');
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

      // Render with unique ID
      const id = `fullscreen-diagram-${Math.random().toString(36).substr(2, 9)}`;
      const { svg } = await mermaid.render(id, chart.trim());

      return svg;

    } catch (error) {
      console.error('Fullscreen rendering error:', error);
      return null;
    }
  }, [chart]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);


  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    setIsFullscreen(prev => {
      if (!prev) {
        // Opening fullscreen - set zoom to 100% and render fullscreen version
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

  const resetZoom = useCallback(() => {
    setZoom(1); // Simply reset to 100%
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

      canvas.width = svgWidth * 2;
      canvas.height = svgHeight * 2;
      ctx.scale(2, 2);

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
        canvas.toBlob((pngBlob) => {
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'diagram.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
        }, 'image/png', 0.95);
      };

      img.onerror = (error) => {
        console.error('SVG to PNG conversion failed:', error);
        NotificationManager.error('PNG экспорт не удался: ' + error.message);
      };

      img.src = dataUrl;

    } catch (error) {
      console.error('PNG export error:', error);
      NotificationManager.error('PNG экспорт не удался: ' + error.message);
    }
  }, [svgContent]);


  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
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
        svgElement.style.maxWidth = '100%';
        svgElement.style.width = '100%';
        svgElement.style.minHeight = '300px';
        svgElement.style.minWidth = '700px';
      }
    }
  }, [svgContent]);

  const renderDiagramContent = (ref, isFullscreenMode = false) => (
    <div
      className={`mermaid-diagram-content ${isFullscreenMode ? 'mermaid-diagram-content--fullscreen' : ''}`}
      style={{
        minHeight: isRendering ? '50px' : 'auto',
        display: 'flex',
        alignItems: isRendering ? 'center' : 'stretch',
        justifyContent: isRendering ? 'center' : 'stretch',
        transform: isFullscreenMode ? `scale(${zoom})` : 'none',
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      {isRendering && (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Rendering diagram...
        </div>
      )}
      {!isRendering && errorMessage && (
        <div className="mermaid-error">
          <strong>Mermaid Diagram Error:</strong>
          <pre>{errorMessage}</pre>
        </div>
      )}
      {!isRendering && svgContent && !errorMessage && (
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
        {!isRendering && svgContent && !errorMessage && (
          <div className="mermaid-diagram__controls">
            <button
              className="mermaid-diagram__control-btn"
              onClick={downloadPNG}
              title="Скачать PNG"
            >
              <Icon className="fa fa-download" />
            </button>
            <button
              className="mermaid-diagram__control-btn"
              onClick={toggleFullscreen}
              title="Открыть во весь экран"
            >
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
                  title="Уменьшить"
                >
                  <Icon className="fa fa-search-minus" />
                </button>
                <span className="mermaid-fullscreen-modal__zoom-level">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="mermaid-fullscreen-modal__control-btn"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  title="Увеличить"
                >
                  <Icon className="fa fa-search-plus" />
                </button>
              </div>
              <button
                className="mermaid-fullscreen-modal__control-btn"
                onClick={resetZoom}
                title="Подогнать под экран"
              >
                <Icon className="fa fa-arrows-alt" />
              </button>
            </div>

            <div className="mermaid-fullscreen-modal__actions">
              <button
                className="mermaid-fullscreen-modal__control-btn"
                onClick={downloadPNG}
                title="Скачать PNG"
              >
                <Icon className="fa fa-download" />
              </button>
              <button
                className="mermaid-fullscreen-modal__control-btn mermaid-fullscreen-modal__close-btn"
                onClick={toggleFullscreen}
                title="Закрыть (Esc)"
              >
                <Icon className="fa fa-times" />
              </button>
            </div>
          </div>

          <div className="mermaid-fullscreen-modal__content">
            {renderDiagramContent(fullscreenRef, true)}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(MermaidDiagram);
