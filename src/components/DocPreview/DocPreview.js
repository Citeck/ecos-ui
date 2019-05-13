import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import './DocPreview.scss';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';

let _docPreview = 'ecos-doc-preview-dashlet';

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: undefined
    };
  }

  componentDidMount() {
    let { link } = this.props;

    let loadingTask = pdfjs.getDocument(link);

    loadingTask.promise.then(
      res => {
        console.log(`Document loaded: ${res.numPages} page(s)`, res);
        this.setState({ pdf: res });
      },
      err => {
        console.error(`Error during loading document: ${err}`);
      }
    );
  }

  onChangeSettings = () => {};

  render() {
    let { pdf = {} } = this.state;
    let { _pdfInfo = {} } = pdf;
    let { numPages } = _pdfInfo;

    return (
      <div className={classNames(_docPreview)}>
        <Toolbar totalPages={numPages} onChangeSettings={this.onChangeSettings} />

        <PdfViewer pdf={pdf} />
      </div>
    );
  }
}

export default DocPreview;
