import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';

import PdfPage from './PdfPage';

class PdfViewer extends PureComponent {
  static propTypes = {
    pdf: PropTypes.object.isRequired,
    defHeight: PropTypes.number,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool,
      currentPage: PropTypes.number
    }),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    pdf: {},
    settings: {}
  };

  constructor(props) {
    super(props);

    this.instanceId = uniqueId('ecos-doc-preview-page-');
    this.state = {
      needUpdate: false,
      renderedPages: []
    };
  }

  get pages() {
    const { pdf } = this.props;
    const numPages = get(pdf, '_pdfInfo.numPages', 0);
    const arrayPages = new Array(numPages);

    return arrayPages.fill(0);
  }

  componentDidMount() {
    this.renderPagesWithDelay();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pdf !== this.props.pdf) {
      this.setState({ renderedPages: [] }, this.renderPagesWithDelay);
    }
  }

  onUpdate() {
    this.setState({ needUpdate: true }, () => this.setState({ needUpdate: false }));
  }

  async renderPagesWithDelay() {
    const pages = this.pages;
    for (let i = 0; i < pages.length; i++) {
      this.setState(prevState => ({
        renderedPages: [...prevState.renderedPages, pages[i]]
      }));
      await this.delay(200);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    const { needUpdate } = this.state;
    const { forwardedRef, ...props } = this.props;
    const { renderedPages } = this.state;

    return (
      !needUpdate && (
        <div ref={forwardedRef}>
          {renderedPages.map((_, index) => (
            <PdfPage key={`${this.instanceId}-${index + 1}`} {...props} pageNumber={index + 1} />
          ))}
        </div>
      )
    );
  }
}

export default PdfViewer;
