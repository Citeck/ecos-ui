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

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: undefined,
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

  componentDidUpdate(nextProps) {
    console.log('>>>', nextProps);
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

  render() {
    let { link } = this.props;
    let { pdf = {}, settings } = this.state;
    let { _pdfInfo = {} } = pdf;
    let { numPages } = _pdfInfo;
    let PDF = getViewer(PdfViewer, _docPreview);
    let IMG = getViewer(ImgViewer, _docPreview);

    return (
      <div className={classNames(_docPreview)}>
        <Toolbar totalPages={numPages} onChangeSettings={this.onChangeSettings} ctrClass={_docPreview} isPDF={this.isPDF} />
        {this.isPDF ? <PDF pdf={pdf} settings={settings} /> : <IMG urlImg={link} settings={settings} />}
      </div>
    );
  }
}

export default DocPreview;
