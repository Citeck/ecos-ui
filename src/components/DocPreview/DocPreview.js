import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';
import ImgViewer from './ImgViewer';
import getViewer from './Viewer';
import { fileDownload, isPDFbyStr } from '../../helpers/util';

// 2.1.266 version of worker for 2.1.266 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@2.1.266/build/pdf.worker.min.js';

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired,
    className: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isSync: PropTypes.bool,
    errMsg: PropTypes.string
  };

  static defaultProps = {
    className: '',
    height: 'inherit',
    scale: 0.5,
    isSync: false,
    errMsg: ''
  };

  static className = 'ecos-doc-preview';

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: {},
      isLoading: !props.isSync || this.isPDF,
      scrollPage: 0,
      isFullscreen: false
    };
  }

  componentDidMount() {
    if (this.isPDF) {
      const { link } = this.props;

      this.loadPDF(link);
    }
  }

  componentWillReceiveProps(nextProps) {
    let oldProps = this.props;
    let { link } = nextProps;

    if (oldProps.link !== link) {
      this.loadPDF(link);
    }
  }

  get isPDF() {
    const { link } = this.props;

    return isPDFbyStr(link);
  }

  get commonProps() {
    const { height, errMsg } = this.props;
    const { settings, isLoading } = this.state;

    return {
      settings,
      height,
      isLoading,
      errMsg,
      calcScale: this.setCalcScale,
      onFullscreen: this.onFullscreen
    };
  }

  loadPDF = link => {
    const loadingTask = pdfjs.getDocument(link);

    loadingTask.promise.then(
      pdf => {
        this.setState({ pdf, isLoading: false });
      },
      err => {
        console.error(`Error during loading document: ${err}`);
        this.setState({ isLoading: false });
      }
    );
  };

  onChangeSettings = settings => {
    this.setState({ settings });
  };

  onDownload = () => {
    const { link } = this.props;

    fileDownload(link);
  };

  onFullscreen = (isFullscreen = false) => {
    this.setState(state => ({
      settings: {
        ...state.settings,
        isFullscreen
      }
    }));
  };

  setScrollPage = (scrollPage = 0) => {
    this.setState(state => ({
      scrollPage,
      settings: {
        ...state.settings,
        currentPage: scrollPage
      }
    }));
  };

  setCalcScale = calcScale => {
    this.setState({ calcScale });
  };

  pdfViewer() {
    const { pdf } = this.state;

    return <Pdf pdf={pdf} scrollPage={this.setScrollPage} {...this.commonProps} />;
  }

  imgViewer() {
    const { link } = this.props;

    return <Img urlImg={link} {...this.commonProps} />;
  }

  render() {
    const { scale, className } = this.props;
    const { pdf, scrollPage, calcScale } = this.state;
    const { _pdfInfo = {} } = pdf;
    const { numPages = 0 } = _pdfInfo;

    return (
      <div className={classNames(DocPreview.className, className)}>
        <Toolbar
          totalPages={numPages}
          ctrClass={DocPreview.className}
          isPDF={this.isPDF}
          onChangeSettings={this.onChangeSettings}
          onDownload={this.onDownload}
          onFullscreen={this.onFullscreen}
          scale={scale}
          scrollPage={scrollPage}
          calcScale={calcScale}
        />
        {this.isPDF ? this.pdfViewer() : this.imgViewer()}
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, DocPreview.className, true);
const Img = getViewer(ImgViewer, DocPreview.className);

export default DocPreview;
