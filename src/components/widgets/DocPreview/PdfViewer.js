import React from 'react';
import PropTypes from 'prop-types';
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

  render() {
    const { forwardedRef, ...props } = this.props;
    let { pdf } = this.props;
    let { _pdfInfo = {} } = pdf;
    let { numPages = 0 } = _pdfInfo;
    let arrayPages = [];

    while (numPages) {
      arrayPages.push(numPages--);
    }
    arrayPages.reverse();

    return (
      <div ref={forwardedRef}>
        {arrayPages.map((pageN, idx) => (
          <PdfPage key={`ecos-doc-preview-page-${pageN}-${idx}`} {...props} pageNumber={pageN} />
        ))}
      </div>
    );
  }
}

export default PdfViewer;
