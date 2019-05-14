import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import './DocPreview.scss';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';
import ImgViewer from './ImgViewer';
import getViewer from './Viewer';

let _docPreview = 'ecos-doc-preview-dashlet';
let PDF = getViewer(PdfViewer, _docPreview);
let IMG = getViewer(ImgViewer, _docPreview);

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: {}
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

  get isPDF() {
    const { link } = this.props;
    const pdf = 'pdf';
    const pointIdx = link.lastIndexOf(pdf);
    const format = link.substr(pointIdx);

    return format.toLowerCase() === pdf;
  }

  onChangeSettings = settings => {
    this.setState({ settings });
  };

  onDownload = () => {
    const { link } = this.props;
    //todo think...
    window.open(link, 'Download');
  };

  render() {
    let { link } = this.props;
    let { pdf, settings } = this.state;
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
        {this.isPDF ? <PDF pdf={pdf} settings={settings} /> : <IMG urlImg={link} settings={settings} />}
      </div>
    );
  }
}

export default DocPreview;
