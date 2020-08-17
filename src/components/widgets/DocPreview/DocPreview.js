import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import ReactResizeDetector from 'react-resize-detector';

import { DocPreviewApi } from '../../../api/docPreview';
import { DocScaleOptions } from '../../../constants';
import { getOptimalHeight } from '../../../helpers/layout';
import { isPDFbyStr, t } from '../../../helpers/util';
import { InfoText, Loader } from '../../common';
import { Btn } from '../../common/btns';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';
import ImgViewer from './ImgViewer';
import getViewer from './Viewer';

import './style.scss';

// 2.4.456 version of worker for 2.4.456 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.4.456/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/js/lib/pdf.worker.min.js?v=2.4.456`;

const Labels = {
  Errors: {
    FAILURE_FETCH: 'doc-preview.error.failure-to-fetch',
    LOADING_FAILURE: 'doc-preview.error.loading-failure',
    NOT_SPECIFIED: 'doc-preview.error.not-specified'
  },
  DOWNLOAD: 'doc-preview.download'
};
const decreasingSteps = [562, 387, 293];

class DocPreview extends Component {
  _toolbarRef = null;
  _bodyRef = null;

  static propTypes = {
    link: PropTypes.string,
    className: PropTypes.string,
    fileName: PropTypes.string,
    recordId: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    firstPageNumber: PropTypes.number,
    byLink: PropTypes.bool,
    noIndents: PropTypes.bool,
    resizable: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    runUpdate: PropTypes.bool,
    clear: PropTypes.bool, // call clear state method
    setUserScale: PropTypes.func,
    setToolbarRef: PropTypes.func,
    scrollbarProps: PropTypes.object
  };

  static defaultProps = {
    className: '',
    height: 'inherit',
    scale: DocScaleOptions.AUTO,
    firstPageNumber: 1,
    fileName: ''
  };

  state = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: {},
      isLoading: this.isPDF,
      scrollPage: props.firstPageNumber,
      recordId: props.recordId || this.getRecordId(),
      link: props.link,
      contentHeight: 0,
      error: '',
      fileName: props.fileName,
      downloadData: {},
      wrapperWidth: 0
    };
  }

  componentDidMount() {
    this.exist = true;

    if (this.isPDF) {
      const { link } = this.props;

      this.loadPDF(link);
    }

    this.getUrlByRecord();
  }

  componentWillReceiveProps(nextProps) {
    const prevProps = this.props;
    const { link, isLoading, byLink, isCollapsed, runUpdate, clear } = nextProps;
    const { recordId } = this.state;
    const isPdf = isPDFbyStr(link);
    const newState = {};

    if (isLoading !== prevProps.isLoading && !isPdf) {
      newState.isLoading = isLoading;
    }

    if (
      (byLink && prevProps.link !== link && isPdf) ||
      (byLink && prevProps.link !== link && isPdf && prevProps.isCollapsed && !isCollapsed)
    ) {
      newState.isLoading = true;
      newState.pdf = {};
      this.loadPDF(link);
    }

    if (prevProps.link !== link) {
      newState.link = link;
    }

    const newRecordId = nextProps.recordId || this.getRecordId();

    if ((!byLink && recordId !== newRecordId) || (!byLink && prevProps.isCollapsed && !isCollapsed)) {
      newState.recordId = newRecordId;
    }

    if (!prevProps.runUpdate && runUpdate) {
      this.getUrlByRecord();
    }

    if (!prevProps.clear && clear) {
      this.clearState();
    }

    if ((!prevProps.fileName && nextProps.fileName) || prevProps.fileName !== nextProps.fileName) {
      newState.fileName = nextProps.fileName;
    }

    this.setState({ ...newState }, () => {
      if (newState.recordId) {
        this.getUrlByRecord();
      }

      if (!newState.fileName) {
        this.getFileName();
      }

      if (!newState.downloadData || !newState.downloadData.link) {
        this.getDownloadData();
      }
    });
  }

  componentWillUnmount() {
    this.exist = false;
    this.onResizeWrapper.cancel();
  }

  get decreasingStep() {
    const { wrapperWidth } = this.state;
    let step = decreasingSteps.findIndex(item => item < wrapperWidth);

    if (step === -1) {
      step = decreasingSteps.length;
    }

    if (!step) {
      return '';
    }

    return step;
  }

  clearState = () => {
    this.setState({
      pdf: {},
      settings: {},
      isLoading: false,
      scrollPage: 1,
      recordId: '',
      link: '',
      contentHeight: 0,
      error: '',
      fileName: '',
      downloadData: {}
    });
  };

  get isPDF() {
    const { link } = this.state;

    return isPDFbyStr(link);
  }

  get commonProps() {
    const { scrollbarProps } = this.props;
    const { settings } = this.state;

    const props = {
      settings,
      isLoading: !this.loaded,
      calcScale: this.setCalcScale,
      getContentHeight: this.getContentHeight,
      scrollbarProps
    };

    if (this.props.getContainerPageHeight) {
      props.getContainerPageHeight = this.props.getContainerPageHeight;
    }

    return props;
  }

  get loaded() {
    const { link, isLoading } = this.state;

    return !isLoading && !!link && !this.message;
  }

  get message() {
    const { pdf, link, error } = this.state;
    const { isLoading, byLink, link: customLink } = this.props;

    if (isLoading) {
      return null;
    }

    if (!isEmpty(error)) {
      return error;
    }

    if ((byLink && !customLink) || (pdf === undefined && !link)) {
      return t(Labels.Errors.NOT_SPECIFIED);
    }

    if (!isEmpty(pdf) && !pdf._pdfInfo) {
      return t(Labels.Errors.LOADING_FAILURE);
    }

    return null;
  }

  get height() {
    const { contentHeight } = this.state;
    const { height, minHeight, maxHeight } = this.props;

    return getOptimalHeight(height, contentHeight, minHeight, maxHeight, !this.loaded) || '100%';
  }

  get hiddenTool() {
    const heightTool = get(this._toolbarRef, 'offsetHeight', 0) + 10;
    const heightBody = get(this._bodyRef, 'offsetHeight', 0);

    return heightTool >= heightBody && !this.message;
  }

  getRecordId() {
    return queryString.parseUrl(window.location.href).query.recordRef || '';
  }

  getUrlByRecord = () => {
    const { byLink } = this.props;
    const { recordId } = this.state;

    if (byLink || !recordId) {
      return;
    }

    this.setState({ isLoading: true });
    DocPreviewApi.getPreviewLinkByRecord(recordId).then(link => {
      if (this.exist) {
        const error = link ? '' : t(Labels.Errors.FAILURE_FETCH);

        this.setState({ isLoading: false, link, error });

        if (link && isPDFbyStr(link)) {
          this.loadPDF(link);
        }
      }
    });
  };

  getFileName = () => {
    const { byLink } = this.props;
    const { recordId } = this.state;

    if (byLink || !recordId) {
      return;
    }

    DocPreviewApi.getFileName(recordId).then(fileName => {
      this.exist && this.setState({ fileName });
    });
  };

  getDownloadData() {
    const { recordId, byLink, link, fileName } = this.state;

    if (byLink && link) {
      this.setState({ downloadData: { link, fileName } });
      return;
    }

    if (!recordId) {
      return;
    }

    DocPreviewApi.getDownloadData(recordId).then(downloadData => {
      this.exist && this.setState({ downloadData });
    });
  }

  setToolbarRef = ref => {
    if (ref) {
      this._toolbarRef = ref;

      if (typeof this.props.setToolbarRef === 'function') {
        this.props.setToolbarRef(ref);
      }
    }
  };

  setBodyRef = ref => {
    if (ref) {
      this._bodyRef = ref;
    }
  };

  loadPDF = link => {
    const { firstPageNumber } = this.props;
    const loadingTask = pdfjs.getDocument(link);

    this.setState({ scrollPage: firstPageNumber, isLoading: true });

    loadingTask.promise.then(
      pdf => {
        this.exist && this.setState({ pdf, isLoading: false, scrollPage: firstPageNumber, error: '' });
      },
      err => {
        console.error(`Error during loading document: ${err}`);
        this.exist && this.setState({ isLoading: false, error: t(Labels.Errors.FAILURE_FETCH) });
      }
    );
  };

  onChangeSettings = settings => {
    this.setState({ settings });
    this.props.setUserScale && this.props.setUserScale(settings.scale);
  };

  onFullscreen = () => {
    this.setState(
      state => ({
        settings: {
          ...state.settings,
          isFullscreen: true
        }
      }),
      () => {
        this.setState(state => ({
          settings: {
            ...state.settings,
            isFullscreen: false
          }
        }));
      }
    );
  };

  onResizeWrapper = debounce(wrapperWidth => {
    if (this.state.wrapperWidth === wrapperWidth) {
      return;
    }

    this.setState({ wrapperWidth });
  }, 350);

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

  getContentHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  pdfViewer() {
    const { maxHeight, forwardedRef } = this.props;
    const { pdf } = this.state;

    return <Pdf pdf={pdf} forwardedRef={forwardedRef} defHeight={maxHeight} scrollPage={this.setScrollPage} {...this.commonProps} />;
  }

  imgViewer() {
    const { resizable, forwardedRef } = this.props;
    const { link } = this.state;

    return (
      <Img
        src={link}
        forwardedRef={forwardedRef}
        resizable={resizable}
        {...this.commonProps}
        onError={error => {
          console.error(error);
          this.setState({ error: t(Labels.Errors.FAILURE_FETCH) });
        }}
      />
    );
  }

  renderToolbar() {
    const { scale } = this.props;
    const { pdf, scrollPage, calcScale, downloadData, fileName } = this.state;
    const pages = get(pdf, '_pdfInfo.numPages', 0);

    if (!this.loaded) {
      return null;
    }

    return (
      <Toolbar
        totalPages={pages}
        isPDF={this.isPDF}
        onChangeSettings={this.onChangeSettings}
        onFullscreen={this.onFullscreen}
        scale={scale}
        scrollPage={scrollPage}
        calcScale={calcScale}
        inputRef={this.setToolbarRef}
        fileName={fileName}
        downloadData={downloadData}
      />
    );
  }

  renderViewer() {
    return this.isPDF ? this.pdfViewer() : this.imgViewer();
  }

  renderLoader() {
    const { isLoading } = this.state;

    return isLoading && <Loader className="ecos-doc-preview__loader" />;
  }

  renderMessage() {
    const { downloadData } = this.state;
    const message = this.message;

    return (
      message && (
        <div className="ecos-doc-preview__info-block">
          <InfoText className="ecos-doc-preview__info-block-msg" text={message} />
          {downloadData && downloadData.link && (
            <a href={downloadData.link} download={downloadData.fileName} data-external>
              <Btn className="ecos-btn_narrow">{t(Labels.DOWNLOAD)}</Btn>
            </a>
          )}
        </div>
      )
    );
  }

  render() {
    const { className, noIndents } = this.props;
    const { isLoading } = this.state;

    return (
      <div
        className={classNames('ecos-doc-preview', `ecos-doc-preview_decreasing-step-${this.decreasingStep}`, className, {
          'ecos-doc-preview_hidden': this.hiddenTool
        })}
        style={{ height: this.height }}
      >
        {!isLoading && (
          <div
            ref={this.setBodyRef}
            className={classNames('ecos-doc-preview__content', { 'ecos-doc-preview__content_indents': !noIndents })}
          >
            {this.renderToolbar()}
            {this.renderViewer()}
            {this.renderMessage()}
          </div>
        )}
        {this.renderLoader()}

        <ReactResizeDetector handleWidth onResize={this.onResizeWrapper} />
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, true);
const Img = getViewer(ImgViewer, false);

export default DocPreview;
