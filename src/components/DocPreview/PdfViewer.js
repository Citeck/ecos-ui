import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import PdfPage from './PdfPage';

class PdfViewer extends React.PureComponent {
  static propTypes = {
    pdf: PropTypes.object.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool,
      currentPage: PropTypes.number
    })
  };

  static defaultProps = {
    pdf: {},
    settings: {}
  };

  get pageProps() {
    const { ...props } = this.props;

    return props;
  }

  render() {
    let { pdf } = this.props;
    let { _pdfInfo = {} } = pdf;
    let { numPages = 0 } = _pdfInfo;
    let arrayPages = [];

    while (numPages) {
      arrayPages.push(numPages--);
    }
    arrayPages.reverse();

    return (
      <Fragment>
        {arrayPages.map((pageN, idx) => {
          let key = `ecos-doc-preview-page-${pageN}-${idx}`;

          return (
            <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_pdf" key={key}>
              <div className="ecos-doc-preview__viewer-page-number">{pageN}</div>
              <div className="ecos-doc-preview__viewer-page-content">
                <PdfPage {...this.pageProps} pageNumber={pageN} />
              </div>
            </div>
          );
        })}
      </Fragment>
    );
  }
}

export default PdfViewer;
