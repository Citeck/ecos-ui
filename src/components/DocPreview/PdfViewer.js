import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import PdfPage from './PdfPage';

class PdfViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    pdf: PropTypes.object.isRequired
  };

  static defaultProps = {
    ctrClass: '',
    pdf: {}
  };

  constructor(props) {
    super(props);

    this.state = {};
    this.refScrollbar = React.createRef();
  }

  componentDidUpdate(prevProps) {}

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
        {arrayPages.map(pageN => (
          <div className={`${_pageCtr}`} data-page-number={pageN}>
            <div className={`${_pageCtr}__number`}>{pageN}</div>
            <div style={{ width: 500 }} className={`${_pageCtr}__content`} key={pageN}>
              <PdfPage pdf={pdf} page={pageN} />
            </div>
          </div>
        ))}
      </Fragment>
    );
  }
}

export default PdfViewer;
