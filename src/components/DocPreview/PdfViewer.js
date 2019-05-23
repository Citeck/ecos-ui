import React, { Fragment } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import PdfPage from './PdfPage';

class PdfViewer extends React.PureComponent {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
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
    let { ctrClass, ...props } = this.props;

    return props;
  }

  render() {
    let { pdf, ctrClass } = this.props;
    let { _pdfInfo = {} } = pdf;
    let { numPages = 0 } = _pdfInfo;
    let arrayPages = [];
    let _pageCtr = `${ctrClass}__page-container`;

    while (numPages) {
      arrayPages.push(numPages--);
    }
    arrayPages.reverse();

    return (
      <Fragment>
        {arrayPages.map((pageN, idx) => {
          let key = `${_pageCtr}-${pageN}-${idx}`;

          return (
            <div className={classNames(_pageCtr, `${_pageCtr}_pdf`)} key={key}>
              <div className={`${_pageCtr}__number`}>{pageN}</div>
              <div className={`${_pageCtr}__content`}>
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
