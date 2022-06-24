import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import { isArrayEqual } from 'pdfjs-dist/lib/shared/util';
import * as queryString from 'query-string';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
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
import { Labels } from './util';

import './style.scss';

// 2.4.456 version of worker for 2.4.456 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.4.456/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/js/lib/pdf.worker.min.js?v=2.4.456`;

const decreasingSteps = [562, 387, 293];

class DocPreview extends Component {
  _toolbarRef = null;
  _bodyRef = null;
  _viewerRef = null;

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
    scrollbarProps: PropTypes.object,
    toolbarConfig: PropTypes.object
  };

  static defaultProps = {
    className: '',
    height: 'inherit',
    scale: DocScaleOptions.AUTO,
    firstPageNumber: 1,
    fileName: '',
    scrollbarProps: {},
    toolbarConfig: {}
  };

  state = {};

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: {},
      isLoading: this.isPDF,
      scrollPage: props.firstPageNumber,
      recordId: props.recordId || this.getUrlRecordId(),
      link: props.link,
      contentHeight: 0,
      error: '',
      fileName: props.fileName,
      filesList: [],
      downloadData: {},
      wrapperWidth: 0,
      needRecalculateScale: false,
      mainDoc: {}
    };

    this.bootstrapLink = !!props.link;
  }

  componentDidMount() {
    this.exist = true;
    this.isPDF && this.loadPDF(this.props.link);
    this.runGetData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.wrapperWidth !== this.state.wrapperWidth) {
      const viewerForceUpdate = get(this._viewerRef, 'onUpdate');
      isFunction(viewerForceUpdate) && viewerForceUpdate.call(this._viewerRef);
    }
  }

  /**
   * @deprecated
   * @todo use static getDerivedStateFromProps instead
   */
  componentWillReceiveProps(nextProps, nextContext) {
    const prevProps = this.props;
    const { isLoading, byLink, runUpdate, clear } = nextProps;
    const { recordId, link, fileName } = this.state;

    let newState = { recordId, fileName, link };
    let isBigUpdate = false;
    let isUpdatePdf = false;

    //clear state by request
    if (!prevProps.clear && clear) {
      newState = this.getCleanState();
    }

    //additional loader by request
    if (isLoading !== prevProps.isLoading && !isPDFbyStr(link)) {
      newState.isLoading = isLoading;
    }

    //update link if it works by byLink
    if (byLink && link !== nextProps.link) {
      newState.link = nextProps.link;
      isUpdatePdf = isPDFbyStr(link);
    }

    //refresh data
    if (!prevProps.runUpdate && runUpdate) {
      isBigUpdate = true;
      newState.recordId = nextProps.recordId || newState.recordId;
      newState.fileName = nextProps.fileName;
    }

    this.setState({ ...newState }, () => {
      //after update of state, run get of remote data
      isBigUpdate && this.runGetData();
      isUpdatePdf && this.loadPDF(newState.link); //if link is set self
      !newState.fileName && this.getFileName(); //if fileName is not set, get by record
      !get(newState, 'downloadData.link') && this.getDownloadData();
    });
  }

  componentWillUnmount() {
    this.exist = false;
    this.handleResizeWrapper.cancel();
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

  get isPDF() {
    return isPDFbyStr(this.state.link);
  }

  get commonProps() {
    const { scrollbarProps } = this.props;
    const { settings, needRecalculateScale } = this.state;

    const props = {
      settings,
      isLoading: !this.loaded,
      calcScale: this.setCalcScale,
      getContentHeight: this.getContentHeight,
      scrollbarProps,
      needRecalculateScale,
      componentRef: this.setViewerRef
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

  get hiddenPreview() {
    const heightTool = get(this._toolbarRef, 'offsetHeight', 0) + 10;
    const viewer = this._bodyRef && this._bodyRef.querySelector('.ecos-doc-preview__viewer');
    const heightBody = get(viewer, 'offsetHeight', 0);

    return heightTool >= heightBody && !this.message;
  }

  get hiddenToolbar() {
    const { filesList, link, isLoading, error } = this.state;
    return isLoading ? false : filesList.length < 2 && (!!error || !link);
  }

  get isBlockedByRecord() {
    return this.props.byLink || !this.state.recordId;
  }

  get isLastDocument() {
    const { recordId, filesList } = this.state;
    const currentIndex = filesList.findIndex(file => file.recordId === recordId);

    return currentIndex === filesList.length - 1;
  }

  getUrlRecordId() {
    return queryString.parseUrl(window.location.href).query.recordRef || '';
  }

  getCleanState = () => ({
    pdf: {},
    settings: {},
    isLoading: false,
    scrollPage: 1,
    recordId: '',
    link: '',
    contentHeight: 0,
    error: '',
    fileName: '',
    downloadData: {},
    needRecalculateScale: false
  });

  updSettings = (key, val, state = this.state) => ({ ...state.settings, [key]: val });

  runGetData = async () => {
    await this.fetchInfoMainDoc();
    await this.fetchFilesByRecord();
    this.showFileBootstrap();
  };

  //todo: check conditions
  fetchInfoMainDoc = async () => {
    if (!this.isBlockedByRecord) {
      return new Promise(async resolve => {
        const recordId = this.getUrlRecordId();
        const fileName = await DocPreviewApi.getFileName(recordId);
        const link = await DocPreviewApi.getPreviewLinkByRecord(recordId);
        const mainDoc = { recordId, fileName, link };

        this.exist && this.setState({ mainDoc }, () => resolve());
      });
    }
  };

  fetchFilesByRecord = async () => {
    if (!(this.isBlockedByRecord || !this.props.toolbarConfig.showAllDocuments)) {
      return new Promise(async resolve => {
        const filesList = await DocPreviewApi.getFilesList(this.getUrlRecordId());
        const { filesList: oldFiles = [], mainDoc = {} } = this.state;

        if (!!mainDoc.link) {
          filesList.unshift(mainDoc);
        }

        if (!isArrayEqual(oldFiles, filesList)) {
          this.exist && this.setState({ filesList }, () => resolve());
        }
      });
    }
  };

  //todo: check journal / create mainDoc for it
  showFileBootstrap = () => {
    const { filesList = [], mainDoc = {}, link } = this.state;
    const isActualLink = link === mainDoc.link || !!filesList.find(file => file.link === link);

    this.bootstrapLink = isActualLink && this.bootstrapLink;

    if (!this.bootstrapLink) {
      this.handleFileChange(get(filesList, '[0]') || mainDoc);
      this.bootstrapLink = true;
    }
  };

  getFileName = async () => {
    if (this.isBlockedByRecord) {
      return;
    }

    const fileName = await DocPreviewApi.getFileName(this.state.recordId);
    this.exist && this.setState({ fileName });
  };

  getDownloadData() {
    const { recordId, byLink, link, fileName = '' } = this.state;

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
      isFunction(this.props.setToolbarRef) && this.props.setToolbarRef(ref);
    }
  };

  setBodyRef = ref => {
    if (ref) {
      this._bodyRef = ref;
    }
  };

  loadPDF = link => {
    if (!isPDFbyStr(link)) {
      return;
    }

    const loadingTask = pdfjs.getDocument(link);
    const scrollPage = this.state.scrollPage || this.props.firstPageNumber;

    this.setState({ scrollPage, isLoading: true, pdf: {}, error: '' });

    loadingTask.promise.then(
      pdf => this.exist && this.setState({ pdf, isLoading: false, scrollPage, error: '' }),
      err => {
        console.error(`Error during loading document: ${err}`);
        this.exist && this.setState({ isLoading: false, error: t(Labels.Errors.FAILURE_FETCH) });
      }
    );
  };

  handleFileChange = ({ fileName, recordId, link }) => {
    if (link !== this.state.link) {
      const error = !link && t(Labels.Errors.FAILURE_FETCH);

      this.setState(
        {
          ...this.getCleanState(),
          recordId,
          link,
          error,
          fileName,
          downloadData: { link, fileName }
        },
        () => this.loadPDF(link)
      );
    }
  };

  handleChangeSettings = settings => {
    this.setState({ settings }, () => isFunction(this.props.setUserScale) && this.props.setUserScale(settings.scale));
  };

  handleFullscreen = () => {
    this.setState({ settings: this.updSettings('isFullscreen', true) }, () =>
      this.setState({ settings: this.updSettings('isFullscreen', false) })
    );
  };

  handleNextDocument = () => {
    const { recordId, filesList, isLoading } = this.state;

    if (isLoading) {
      return;
    }

    if (Array.isArray(filesList) && filesList.length > 1) {
      const currentIndex = filesList.findIndex(file => file.recordId === recordId);
      const nextFile = filesList[currentIndex + 1];

      nextFile && this.handleFileChange(nextFile);
    }
  };

  handleResizeWrapper = debounce(wrapperWidth => {
    if (this.state.wrapperWidth === wrapperWidth) {
      return;
    }

    this.setState({ wrapperWidth });
  }, 350);

  handleScrollPage = (scrollPage = this.props.firstPageNumber) => {
    this.setState({ scrollPage, settings: this.updSettings('currentPage', scrollPage) });
  };

  setCalcScale = calcScale => {
    this.setState({ calcScale });
  };

  setViewerRef = ref => {
    if (ref) {
      this._viewerRef = ref;
    }
  };

  getContentHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  pdfViewer() {
    const { maxHeight, forwardedRef } = this.props;
    const { pdf } = this.state;

    return (
      <Pdf
        pdf={pdf}
        forwardedRef={forwardedRef}
        defHeight={maxHeight}
        onScrollPage={this.handleScrollPage}
        onNextDocument={this.handleNextDocument}
        isLastDocument={this.isLastDocument}
        {...this.commonProps}
      />
    );
  }

  imgViewer() {
    const { resizable, forwardedRef } = this.props;
    const { link } = this.state;

    return (
      <Img
        src={link}
        forwardedRef={forwardedRef}
        resizable={resizable}
        isLastDocument={this.isLastDocument}
        onNextDocument={this.handleNextDocument}
        {...this.commonProps}
        onError={error => {
          console.error(error);
          this.setState({ error: t(Labels.Errors.FAILURE_FETCH) });
        }}
      />
    );
  }

  renderToolbar() {
    const { scale, toolbarConfig } = this.props;
    const { pdf, scrollPage, calcScale, downloadData, filesList, fileName, recordId } = this.state;
    const pages = get(pdf, '_pdfInfo.numPages', 0);

    return (
      <Toolbar
        totalPages={pages}
        isPDF={this.isPDF}
        scale={scale}
        scrollPage={scrollPage}
        calcScale={calcScale}
        inputRef={this.setToolbarRef}
        fileValue={recordId}
        fileName={fileName}
        filesList={filesList}
        downloadData={downloadData}
        onChangeSettings={this.handleChangeSettings}
        onFullscreen={this.handleFullscreen}
        onFileChange={this.handleFileChange}
        config={toolbarConfig}
        className={classNames({ 'd-none': this.hiddenToolbar })}
      />
    );
  }

  renderViewer() {
    const { link, error } = this.state;

    if (!!error || (!this.bootstrapLink && !link)) {
      return null;
    }

    if (this.isPDF) {
      return this.pdfViewer();
    }

    return this.imgViewer();
  }

  renderLoader() {
    const { isLoading } = this.state;

    return isLoading && <Loader className="ecos-doc-preview__loader" blur />;
  }

  renderMessage() {
    const { downloadData } = this.state;

    return (
      this.message && (
        <div className="ecos-doc-preview__info-block">
          <InfoText className="ecos-doc-preview__info-block-msg" text={this.message} />
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

    return (
      <div
        className={classNames('ecos-doc-preview', className, {
          [`ecos-doc-preview_decreasing-step-${this.decreasingStep}`]: this.decreasingStep,
          'ecos-doc-preview_hidden': this.hiddenPreview
        })}
        style={{ height: this.height }}
      >
        {this.renderLoader()}
        <div ref={this.setBodyRef} className={classNames('ecos-doc-preview__content', { 'ecos-doc-preview__content_indents': !noIndents })}>
          {this.renderToolbar()}
          {this.renderViewer()}
          {this.renderMessage()}
        </div>

        <ReactResizeDetector handleWidth onResize={this.handleResizeWrapper} />
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, true);
const Img = getViewer(ImgViewer, false);

export default DocPreview;
