import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import * as queryString from 'query-string';
import { get, isEmpty } from 'lodash';
import { getOptimalHeight } from '../../helpers/layout';
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
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    firstPageNumber: PropTypes.number,
    recordKey: PropTypes.string,
    byLink: PropTypes.bool
  };

  static defaultProps = {
    link: null,
    className: '',
    height: 'inherit',
    scale: 0.5,
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
      isLoading: this.isPDF,
      scrollPage: props.firstPageNumber,
      isFullscreen: false,
      recordId: this.getRecordId(props),
      link: props.link,
      contentHeight: 0,
      error: ''
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
    const { settings } = this.state;

    return {
      settings,
      isLoading: !this.loaded,
      calcScale: this.setCalcScale,
      onFullscreen: this.onFullscreen,
      onResize: this.onResize
    };
  }

  get loaded() {
    const { link, isLoading } = this.state;

    return !isLoading && !!link && !this.message;
  }

  get message() {
    const { pdf, link, error } = this.state;
    const { isLoading } = this.props;

    if (isLoading) {
      return null;
    }

    if (!isEmpty(error)) {
      return error;
    }

    if (pdf === undefined && !link) {
      return t('doc-preview.error.not-specified');
    }

    if (!isEmpty(pdf) && !pdf._pdfInfo) {
      return t('doc-preview.error.loading-failure');
    }

    return null;
  }

  get height() {
    const { contentHeight } = this.state;
    const { height, minHeight, maxHeight } = this.props;

    return getOptimalHeight(height, contentHeight, minHeight, maxHeight, !this.loaded);
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
        this.setState({ isLoading: false, error: t('Документ не получен') });
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

  onResize = (w, contentHeight) => {
    this.setState({ contentHeight });
  };

  pdfViewer() {
    const { pdf } = this.state;

    return <Pdf pdf={pdf} scrollPage={this.setScrollPage} {...this.commonProps} />;
  }

  imgViewer() {
    const { link } = this.state;

    return (
      <Img
        src={link}
        {...this.commonProps}
        onError={() => {
          this.setState({ error: t('Документ не получен') });
        }}
      />
    );
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
    return this.isPDF ? this.pdfViewer() : this.imgViewer();
  }

  renderLoader() {
    const { isLoading } = this.state;

    return isLoading && <Loader className={`${DocPreview.className}__loader`} />;
  }

  renderMessage() {
    const message = this.message;

    return message && <InfoText text={message} />;
  }

  render() {
    const { className } = this.props;
    const { isLoading } = this.state;

    return (
      <div className={classNames(DocPreview.className, className)} style={{ height: this.height }}>
        {!isLoading && (
          <div className={classNames(`${DocPreview.className}__container`, { 'has-msg': !!this.message })}>
            {this.renderToolbar()}
            {this.renderViewer()}
            {this.renderMessage()}
          </div>
        )}
        {this.renderLoader()}
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, DocPreview.className, true);
const Img = getViewer(ImgViewer, DocPreview.className);

export default DocPreview;
