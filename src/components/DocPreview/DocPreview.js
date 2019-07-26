import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import * as queryString from 'query-string';
import { get, isEmpty } from 'lodash';
import { fileDownload, isPDFbyStr, t } from '../../helpers/util';
import { DocPreviewApi } from '../../api';
import { InfoText, Loader } from '../common';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';
import ImgViewer from './ImgViewer';
import getViewer from './Viewer';

// 2.1.266 version of worker for 2.1.266 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/js/lib/pdf.worker.min.js`;

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string,
    className: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isLoading: PropTypes.bool,
    errMsg: PropTypes.string,
    firstPageNumber: PropTypes.number,
    recordKey: PropTypes.string,
    byLink: PropTypes.bool
  };

  static defaultProps = {
    link: null,
    className: '',
    height: 'inherit',
    minHeight: 'inherit',
    scale: 0.5,
    isLoading: false,
    errMsg: '',
    firstPageNumber: 1,
    recordKey: 'recordRef',
    byLink: false
  };

  static className = 'ecos-dp';

  state = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: {},
      isLoading: props.isLoading || this.isPDF,
      scrollPage: props.firstPageNumber,
      isFullscreen: false,
      recordId: this.getRecordId(props),
      link: props.link
    };
  }

  componentDidMount() {
    if (this.isPDF) {
      const { link } = this.props;

      this.loadPDF(link);
    }

    this.getUrlByRecord();
  }

  componentWillReceiveProps(nextProps) {
    const oldProps = this.props;
    const { link, isLoading, byLink } = nextProps;
    const { recordId } = this.state;
    const newRecordId = this.getRecordId(nextProps);
    const isPdf = isPDFbyStr(link);
    let state = {};

    if (oldProps.isLoading !== isLoading && !isPdf) {
      state = { isLoading };
    }

    if (byLink && oldProps.link !== link && isPdf) {
      state = { isLoading: true, pdf: {} };
      this.loadPDF(link);
    }

    if (oldProps.link !== link) {
      state.link = link;
    }

    if (!byLink && recordId !== newRecordId) {
      this.setState({ recordId: newRecordId }, this.getUrlByRecord);
    }

    this.setState({ ...state });
  }

  get isPDF() {
    const { link } = this.state;

    return isPDFbyStr(link);
  }

  get commonProps() {
    const { errMsg } = this.props;
    const { settings, isLoading } = this.state;

    return {
      settings,
      isLoading,
      errMsg,
      calcScale: this.setCalcScale,
      onFullscreen: this.onFullscreen
    };
  }

  get loaded() {
    const { link, isLoading } = this.state;

    return !isLoading && !!link && !this.message;
  }

  get message() {
    const { pdf, link } = this.state;
    const { isLoading, errMsg } = this.props;

    let message = null;

    if (isLoading) {
      return null;
    }

    if (pdf === undefined && !link) {
      message = { type: 'info', msg: t(errMsg || 'doc-preview.error.not-specified') };
    }

    if (!isEmpty(pdf) && !pdf._pdfInfo) {
      message = { type: 'info', msg: t('doc-preview.error.loading-failure') };
    }

    return message;
  }

  getRecordId(props = this.props) {
    const { recordKey } = props;
    const searchParams = queryString.parse(window.location.search);

    return searchParams[recordKey] || '';
  }

  getUrlByRecord = () => {
    const { recordKey, byLink } = this.props;
    const searchParams = queryString.parse(window.location.search);

    if (byLink || !searchParams[recordKey]) {
      return;
    }

    this.setState({ isLoading: true });
    DocPreviewApi.getLinkByRecord(searchParams[recordKey]).then(link => {
      this.setState({ isLoading: false, link });
      this.loadPDF(link);
    });
  };

  loadPDF = link => {
    const { firstPageNumber } = this.props;
    const loadingTask = pdfjs.getDocument(link);

    this.setState({ scrollPage: firstPageNumber });

    loadingTask.promise.then(
      pdf => {
        this.setState({ pdf, isLoading: false, scrollPage: firstPageNumber });
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
    const { link } = this.state;

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

  setScrollPage = (scrollPage = this.props.firstPageNumber) => {
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
    const { link } = this.state;

    return <Img urlImg={link} {...this.commonProps} />;
  }

  renderToolbar() {
    const { scale } = this.props;
    const { pdf, scrollPage, calcScale } = this.state;
    const pages = get(pdf, '_pdfInfo.numPages', 0);

    return !this.loaded ? null : (
      <Toolbar
        totalPages={pages}
        ctrClass={DocPreview.className}
        isPDF={this.isPDF}
        onChangeSettings={this.onChangeSettings}
        onDownload={this.onDownload}
        onFullscreen={this.onFullscreen}
        scale={scale}
        scrollPage={scrollPage}
        calcScale={calcScale}
      />
    );
  }

  renderViewer() {
    const { isLoading } = this.state;

    return isLoading ? null : this.isPDF ? this.pdfViewer() : this.imgViewer();
  }

  renderLoader() {
    const { isLoading } = this.state;

    return !isLoading ? null : <Loader className={`${DocPreview.className}__loader`} />;
  }

  renderMessage() {
    const message = this.message;

    return !message ? null : <InfoText type={message.type} text={message.msg} />;
  }

  render() {
    const { className, height, minHeight } = this.props;

    return (
      <div className={classNames(DocPreview.className, className)} style={{ height: this.loaded ? height : minHeight }}>
        <div className={classNames(`${DocPreview.className}__container`, { 'has-msg': !!this.message })}>
          {this.renderToolbar()}
          {this.renderViewer()}
          {this.renderMessage()}
        </div>
        {this.renderLoader()}
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, DocPreview.className, true);
const Img = getViewer(ImgViewer, DocPreview.className);

export default DocPreview;
