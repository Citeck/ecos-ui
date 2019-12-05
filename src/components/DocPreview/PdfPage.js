import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import { TextLayerBuilder } from 'pdfjs-dist/lib/web/text_layer_builder.js';
import 'pdfjs-dist/web/pdf_viewer.css';

import { getScale, isMobileDevice } from '../../helpers/util';

class PdfPage extends Component {
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
  refTextLayout = React.createRef();

  componentDidMount() {
    this.renderPage();
  }

  componentDidUpdate() {
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

  get elCanvas() {
    return this.refContainer.current || {};
  }

  get elContainer() {
    return this.props.refViewer.current || {};
  }

  get elTextLayout() {
    return this.refTextLayout.current;
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
    const canvas = this.elCanvas;
    const elContainer = this.elContainer;

    let calcScale = 1;
    let viewport = page.getViewport({ scale: calcScale });

    const [, , origW, origH] = viewport.viewBox;
    const { clientWidth: cW, clientHeight: cH } = elContainer;
    const noHeight = !cH && defHeight && !isMob;

    calcScale = getScale(scale, { width: cW, height: noHeight ? defHeight : cH }, { origW, origH, scaleW: viewport.width }, cW / 3);

    viewport = page.getViewport({ scale: calcScale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const $textLayer = this.elTextLayout;

    if (!$textLayer) {
      return null;
    }

    $textLayer.style.height = viewport.height + 'px';
    $textLayer.style.width = viewport.width + 'px';
    $textLayer.style.top = canvas.offsetTop + 'px';
    $textLayer.style.left = canvas.offsetLeft + 'px';

    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    };

    page.render(renderContext);
    page.getTextContent().then(function(textContent) {
      let textLayer = new TextLayerBuilder({
        textLayerDiv: $textLayer,
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
      const diff = elContainer.parentElement.clientHeight - elContainer.clientHeight + margin;
      const containerPageHeight = viewport.height + diff;

      this.props.getContainerPageHeight && this.props.getContainerPageHeight(containerPageHeight);
    }
  };

  render() {
    return (
      <Fragment>
        <canvas ref={this.refContainer} />
        <div ref={this.refTextLayout} className="ecos-doc-preview__viewer-page-content-text textLayer" />
      </Fragment>
    );
  }
}

export default PdfPage;
