import React from 'react';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';

import PdfPage from './PdfPage';

class PdfViewer extends React.PureComponent {
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
      needUpdate: false
    };
  }

  get pages() {
    const { pdf } = this.props;
    const numPages = get(pdf, '_pdfInfo.numPages', 0);
    const arrayPages = new Array(numPages);

    return arrayPages.fill(0);
  }

  onUpdate() {
    this.setState({ needUpdate: true }, () => this.setState({ needUpdate: false }));
  }

  render() {
    const { needUpdate } = this.state;
    const { forwardedRef, ...props } = this.props;

    return (
      !needUpdate && (
        <div ref={forwardedRef}>
          {this.pages.map((_, index) => (
            <PdfPage key={`${this.instanceId}-${index + 1}`} {...props} pageNumber={index + 1} />
          ))}
        </div>
      )
    );
  }
}

export default PdfViewer;
