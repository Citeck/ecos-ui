import React from 'react';
import PropTypes from 'prop-types';
import { TextLayerBuilder } from 'pdfjs-dist/lib/web/text_layer_builder.js';

import { getScale, isMobileDevice } from '../../../helpers/util';

import 'pdfjs-dist/web/pdf_viewer.css';

class PdfPage extends React.PureComponent {
  static propTypes = {
    pdf: PropTypes.object.isRequired,
    pageNumber: PropTypes.number.isRequired,
    defHeight: PropTypes.number,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool,
      currentPage: PropTypes.number
    }),
    calcScale: PropTypes.func,
    getContainerPageHeight: PropTypes.func,
    refViewer: PropTypes.object
  };

  static defaultProps = {
    settings: {
      scale: 1,
      isFullscreen: false
    }
  };

  refContainer = React.createRef();

  componentDidMount() {
    this.renderPage();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.renderPage();
  }

  shouldComponentUpdate(nextProps) {
    const {
      settings: { scale: newScale }
    } = nextProps;
    const {
      settings: { scale: oldScale }
    } = this.props;

    return newScale !== oldScale;
  }

  renderPage() {
    const { pdf, pageNumber } = this.props;

    pdf.getPage(pageNumber).then(this.setPageParams);
  }

  setPageParams = page => {
    const isMob = isMobileDevice();
    const {
      settings: { scale },
      defHeight
    } = this.props;
    const elPageArea = this.refContainer.current;
    if (!elPageArea) {
      return;
    }

    const elCanvas = elPageArea.querySelector('.ecos-doc-preview__viewer-page-content-canvas');
    const elTextLayer = elPageArea.querySelector('.ecos-doc-preview__viewer-page-content-text');
    const elViewer = this.props.refViewer.current || {};

    let calcScale = 1;
    let viewport = page.getViewport({ scale: calcScale });

    const [, , origW, origH] = viewport.viewBox;
    const { clientWidth: cW, clientHeight: cH } = elViewer;
    const noHeight = !cH && defHeight && !isMob;

    calcScale = getScale(scale, { width: cW, height: noHeight ? defHeight : cH }, { origW, origH, scaleW: viewport.width }, cW / 3);

    viewport = page.getViewport({ scale: calcScale });

    if (!elTextLayer) {
      return null;
    }

    elCanvas.height = viewport.height;
    elCanvas.width = viewport.width;

    elPageArea.style.width = viewport.width + 'px';

    elTextLayer.style.height = viewport.height + 'px';
    elTextLayer.style.width = viewport.width + 'px';
    elTextLayer.style.top = elCanvas.offsetTop + 'px';
    elTextLayer.style.left = elCanvas.offsetLeft + 'px';

    const renderContext = {
      canvasContext: elCanvas.getContext('2d'),
      viewport: viewport
    };

    page.render(renderContext);
    page.getTextContent().then(function(textContent) {
      let textLayer = new TextLayerBuilder({
        textLayerDiv: elTextLayer,
        pageIndex: page.pageIndex,
        viewport: viewport
      });

      textLayer.setTextContent(textContent);
      textLayer.render();
    });

    if (Number.isNaN(parseFloat(scale))) {
      this.props.calcScale && this.props.calcScale(calcScale);
    }

    if (isMob) {
      const margin = 30;
      const diff = elViewer.parentElement.clientHeight - elViewer.clientHeight + margin;
      const containerPageHeight = viewport.height + diff;

      this.props.getContainerPageHeight && this.props.getContainerPageHeight(containerPageHeight);
    }
  };

  render() {
    const { pageNumber } = this.props;

    return (
      <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_pdf" ref={this.refContainer}>
        <div className="ecos-doc-preview__viewer-page-number">{pageNumber}</div>
        <div className="ecos-doc-preview__viewer-page-content">
          <canvas className="ecos-doc-preview__viewer-page-content-canvas" />
          <div className="ecos-doc-preview__viewer-page-content-text textLayer" />
        </div>
      </div>
    );
  }
}

export default PdfPage;
