import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import PdfPage from './PdfPage';

class PdfViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    pdf: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired
  };

  static defaultProps = {
    pdf: {},
    settings: {}
  };

  constructor(props) {
    super(props);

    this.state = {};
    this.refScrollbar = React.createRef();
  }

  get pageProps() {
    let { ctrClass, ...props } = this.props;

    return props;
  }

  render() {
    let { pdf, ctrClass, settings } = this.props;
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
            <div className={`${_pageCtr}`} key={key}>
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
