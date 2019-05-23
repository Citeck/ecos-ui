import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { getScale } from '../../helpers/util';
import { TextLayerBuilder } from 'pdfjs-dist/lib/web/text_layer_builder.js';
import 'pdfjs-dist/web/pdf_viewer.css';

class PdfPage extends Component {
  static propTypes = {
    pdf: PropTypes.object.isRequired,
    pageNumber: PropTypes.number.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool,
      currentPage: PropTypes.number
    }),
    calcScale: PropTypes.func
  };

  static defaultProps = {
    settings: {
      scale: 1,
      isFullscreen: false
    },
    calcScale: () => {}
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
    let {
      settings: { scale: newScale }
    } = nextProps;
    let {
      settings: { scale: oldScale }
    } = this.props;

    if (newScale !== oldScale) {
      return true;
    }

    return false;
  }

  get elCanvas() {
    return this.refContainer.current || {};
  }

  get elContainer() {
    return this.props.refViewer.current || {};
  }

  get elTextLayout() {
    return this.refTextLayout.current || {};
  }

  renderPage() {
    let { pdf, pageNumber } = this.props;

    pdf.getPage(pageNumber).then(this.setPageParams);
  }

  setPageParams = page => {
    let {
      settings: { scale }
    } = this.props;
    let canvas = this.elCanvas;
    let elContainer = this.elContainer;
    let [, , width, height] = page.getViewport().viewBox;
    let { clientWidth: cW, clientHeight: cH } = elContainer;
    let calcScale = getScale(scale, { width: cW, height: cH }, { width, height }, cW / 3);

    let viewport = page.getViewport(calcScale);

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    let $textLayer = this.elTextLayout;
    $textLayer.style.height = viewport.height + 'px';
    $textLayer.style.width = viewport.width + 'px';
    $textLayer.style.top = canvas.offsetTop + 'px';
    $textLayer.style.left = canvas.offsetLeft + 'px';

    let renderContext = {
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
      this.props.calcScale(calcScale);
    }
  };

  render() {
    return (
      <Fragment>
        <canvas ref={this.refContainer} />
        <div ref={this.refTextLayout} className={'textLayer'} />
      </Fragment>
    );
  }
}

export default PdfPage;
