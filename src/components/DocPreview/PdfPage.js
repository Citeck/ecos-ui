import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class PdfPage extends Component {
  static propTypes = {
    pdf: PropTypes.object.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool
    })
  };

  static defaultProps = {
    settings: {
      scale: 0,
      isFullscreen: false
    }
  };

  refContainer = React.createRef();

  componentDidMount() {
    let { page } = this.props;

    this.renderPage(page);
  }

  renderPage(num) {
    let {
      pdf,
      settings: { scale, isFullscreen }
    } = this.props;
    let canvas = this.refContainer.current;

    pdf.getPage(num).then(function(page) {
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
    return <canvas ref={this.refContainer} height={'100px'} width={'100px'} />;
  }
}

export default PdfPage;
