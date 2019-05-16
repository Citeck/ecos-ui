import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { openFullscreen, getScale } from '../../helpers/util';

class PdfPage extends Component {
  static propTypes = {
    pdf: PropTypes.object.isRequired,
    pageNumber: PropTypes.number.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool
    })
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
  }

  get elCanvas() {
    return this.refContainer.current || {};
  }

  get elContainer() {
    return this.props.refViewer.current || {};
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
    let [x1, y1, width, height] = page.getViewport().viewBox;
    let { clientWidth: cW, clientHeight: cH } = elContainer;

    scale = getScale(scale, { width: cW, height: cH }, { width, height }, cW / 3);

    let viewport = page.getViewport(scale);

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    let renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    };

    page.render(renderContext);
    this.setState({ scale });
  };

  render() {
    return <canvas ref={this.refContainer} />;
  }
}

export default PdfPage;
