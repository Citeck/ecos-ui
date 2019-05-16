import React, { Component } from 'react';
import PropTypes from 'prop-types';

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

  renderPage() {
    let {
      pdf,
      pageNumber,
      settings: { scale, isFullscreen }
    } = this.props;
    let canvas = this.refContainer.current;

    pdf.getPage(pageNumber).then(function(page) {
      let viewport = page.getViewport(scale);

      let context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      let renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext);
    });
  }

  render() {
    return <canvas ref={this.refContainer} />;
  }
}

export default PdfPage;
