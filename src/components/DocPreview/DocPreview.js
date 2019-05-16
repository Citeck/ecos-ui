import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';
import ImgViewer from './ImgViewer';
import getViewer from './Viewer';
import { isPDFbyStr, fileDownload } from '../../helpers/util';

let _docPreview = 'ecos-doc-preview';
let PDF = getViewer(PdfViewer, _docPreview);

let IMG = getViewer(ImgViewer, _docPreview);

// 2.1.266 version of worker for 2.1.266 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@2.1.266/build/pdf.worker.min.js';

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: {},
      isLoading: this.isPDF
    };
  }

  componentDidMount() {
    if (this.isPDF) {
      let { link } = this.props;
      let loadingTask = pdfjs.getDocument(link);

      loadingTask.promise.then(
        res => {
          console.log(`Document loaded: ${res.numPages} page(s)`, res);
          this.setState({ pdf: res, isLoading: false });
        },
        err => {
          console.error(`Error during loading document: ${err}`);
          this.setState({ isLoading: false });
        }
      );
    }
  }

  get isPDF() {
    const { link } = this.props;

    return isPDFbyStr(link);
  }

  onChangeSettings = settings => {
    this.setState({ settings });
  };

  onDownload = () => {
    const { link } = this.props;

    fileDownload(link);
  };

  render() {
    let { link } = this.props;
    let { pdf, settings, isLoading } = this.state;
    let { _pdfInfo = {} } = pdf;
    let { numPages = 0 } = _pdfInfo;

    return (
      <div className={classNames(_docPreview)}>
        <Toolbar
          totalPages={numPages}
          ctrClass={_docPreview}
          isPDF={this.isPDF}
          onChangeSettings={this.onChangeSettings}
          onDownload={this.onDownload}
        />
        {this.isPDF ? <PDF pdf={pdf} settings={settings} isLoading={isLoading} /> : <IMG urlImg={link} settings={settings} />}
      </div>
    );
  }
}

export default DocPreview;
