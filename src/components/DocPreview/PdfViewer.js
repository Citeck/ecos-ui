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
        {arrayPages.map((pageN, idx) => {
          let key = `ecos-doc-preview-page-${pageN}-${idx}`;

          return (
            <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_pdf" key={key}>
              <div className="ecos-doc-preview__viewer-page-number">{pageN}</div>
              <div className="ecos-doc-preview__viewer-page-content">
                <PdfPage {...props} pageNumber={pageN} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default PdfViewer;
