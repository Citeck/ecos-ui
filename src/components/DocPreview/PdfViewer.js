import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../helpers/util';

let _viewer = `ecos-doc-preview-dashlet__viewer`;

class PdfViewer extends Component {
  static propTypes = {
    pdf: PropTypes.object.isRequired
  };

  static defaultProps = {
    pdf: {}
  };

  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    let { pdf = {} } = this.state;
    let { _pdfInfo = {} } = pdf;
    let { numPages = 0 } = _pdfInfo;
    let arrayPages = [];

    while (numPages) {
      arrayPages.push(numPages--);
    }
    arrayPages.reverse();

    return (
      <div className={_viewer}>
        {numPages ? (
          <div className={classNames(`${_viewer}__pages`)}>
            {arrayPages.map(pageN => {
              /*<DocPage config={this.state} page={pageN}/>*/
            })}
          </div>
        ) : (
          <div className={classNames(`${_viewer}__msg ${_viewer}__msg_error`)}>{t('Нет документа для отображения')}</div>
        )}
      </div>
    );
  }
}

export default PdfViewer;
