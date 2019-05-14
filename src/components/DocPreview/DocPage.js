import React, { Component } from 'react';
//todo Draft!!!
export default class DocPage extends Component {
  refContainer = React.createRef();

  componentDidMount() {
    let { page } = this.props;

    this.renderPage(page);
  }

  renderPage(num) {
    let { pdf, scale = 1.5 } = this.props;
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
