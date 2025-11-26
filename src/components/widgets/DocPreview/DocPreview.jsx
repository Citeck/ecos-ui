import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import pdfjs from 'pdfjs-dist';
import { isArrayEqual } from 'pdfjs-dist/lib/shared/util';
import PropTypes from 'prop-types';
import * as queryString from 'query-string';
import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';

import { InfoText, Loader } from '../../common';
import { Btn } from '../../common/btns';

import ImgViewer from './ImgViewer';
import PdfViewer from './PdfViewer';
import Toolbar from './Toolbar';
import getViewer from './Viewer';
import { Labels } from './util';

import { DocPreviewApi } from '@/api/docPreview';
import { DocScaleOptions } from '@/constants';
import { getOptimalHeight } from '@/helpers/layout';
import { isPDFbyStr, t } from '@/helpers/util';

import './style.scss';

// 2.4.456 version of worker for 2.4.456 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.4.456/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}js/lib/pdf.worker.min.js?v=2.4.456`;

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
      settings: { scale: props.scale },
      isLoading: true,
      scrollPage: props.firstPageNumber,
      recordId: props.recordId || this.getUrlRecordId(),
      mainRecordId: props.recordId || this.getUrlRecordId(),
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

    if (!isEqual(get(prevProps, 'toolbarConfig'), get(this.props, 'toolbarConfig'))) {
      const showAllDocuments = get(this.props, 'toolbarConfig.showAllDocuments');
      let newState = this.getCleanState();

      if (showAllDocuments) {
        this.bootstrapLink = false;
        newState.recordId = this.props.recordId || this.getUrlRecordId();
      }

      this.setState({ ...newState }, () => {
        this.getDownloadData();
        this.loadPDF(this.state.link);
        this.runGetData();
        this.showFileBootstrap();
      });
      return;
    }

    const { clear, recordId: propRecordId, isLoading: propLoading, byLink, link: propLink, fileName: propFileName, runUpdate } = this.props;
    const {
      clear: prevClear,
      recordId: prevPropRecordId,
      isLoading: prevPropLoading,
      link: prevPropLink,
      runUpdate: prevRunUpdate
    } = prevProps;

    let newState = {};
    let isBigUpdate = false;
    let isUpdatePdf = false;

    // Clear state on clear flag
    if (!prevClear && clear) {
      newState = this.getCleanState();
    }

    // RecordId changed or clear requested => big update
    if ((!prevClear && clear) || prevPropRecordId !== propRecordId) {
      newState = this.getCleanState();
      newState.mainRecordId = propRecordId;
      isBigUpdate = true;
    }

    // Loader toggle for non-PDFs
    if (propLoading !== prevPropLoading && !isPDFbyStr(this.state.link)) {
      newState.isLoading = propLoading;
    }

    // Update link when byLink changes
    if (byLink && prevPropLink !== propLink) {
      newState.link = propLink;
      isUpdatePdf = isPDFbyStr(propLink);
    }

    // Trigger data refresh
    if (!prevRunUpdate && runUpdate) {
      isBigUpdate = true;
      newState.recordId = propRecordId || this.state.recordId;
      newState.fileName = propFileName;
    }

    // If any updates detected, apply setState
    if (Object.keys(newState).length > 0) {
      this.setState({ ...newState }, () => {
        isBigUpdate && this.runGetData();
        isUpdatePdf && this.loadPDF(newState.link);
        !newState.fileName && this.getFileName();
        !get(newState, 'downloadData.link') && this.getDownloadData();
      });
    }
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

    if (!this.isLastDocument) {
      props.onNextDocument = this.handleNextDocument;
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
    return this.props.byLink || !this.state.mainRecordId;
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
    settings: { scale: this.props.scale },
    isLoading: true,
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
    this.setState({ isLoading: false });
  };

  fetchInfoMainDoc = async () => {
    if (!this.isBlockedByRecord) {
      return new Promise(async resolve => {
        const recordId = this.state.mainRecordId;
        const fileName = await DocPreviewApi.getFileName(recordId);
        const link = await DocPreviewApi.getPreviewLinkByRecord(recordId);
        const mainDoc = { recordId, fileName, link };

        this.exist && this.setState({ mainDoc }, () => resolve());
      });
    }
  };

  fetchFilesByRecord = async () => {
    return new Promise(async resolve => {
      const { filesList: oldFiles = [], mainDoc = {}, mainRecordId } = this.state;
      const showAllDocuments = get(this.props.toolbarConfig, 'showAllDocuments');
      const filesList = [];
      const newState = {};

      if (!!mainDoc.link) {
        filesList.unshift(mainDoc);
      }

      if (!(this.isBlockedByRecord || !showAllDocuments)) {
        const list = await DocPreviewApi.getFilesList(mainRecordId);
        filesList.push(...list);
      }

      if (!isArrayEqual(oldFiles, filesList)) {
        newState.filesList = filesList;
      }

      if (!filesList.length) {
        newState.error = t(showAllDocuments ? Labels.Errors.NO_DOCS : Labels.Errors.NO_DOC);
      }

      if (this.exist && !isEmpty(newState)) {
        this.setState(newState, () => resolve());
      }
    });
  };

  showFileBootstrap = () => {
    const { filesList = [], mainDoc = {}, link } = this.state;
    const isActualLink = link === mainDoc.link || !!filesList.find(file => file.link === link);

    this.bootstrapLink = isActualLink && this.bootstrapLink;

    if (!this.bootstrapLink && filesList.length) {
      this.handleFileChange(get(filesList, '[0]'));
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
      this.setState({ downloadData: {} });
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
          isLoading: isPDFbyStr(link),
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
    const { currentPage } = settings || {};
    this.setState(
      { settings, ...(currentPage && { scrollPage: currentPage }) },
      () => isFunction(this.props.setUserScale) && this.props.setUserScale(settings.scale)
    );
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

      this.setState(state => ({
        settings: {
          ...state.settings,
          scale: DocScaleOptions.AUTO
        }
      }));
      isFunction(this.props.setUserScale) && this.props.setUserScale(DocScaleOptions.AUTO);
    }
  };

  handleResizeWrapper = debounce(wrapperWidth => {
    if (this.state.wrapperWidth === wrapperWidth) {
      return;
    }

    this.setState({ wrapperWidth });
  }, 350);

  handleScrollPage = (scrollPage = this.props.firstPageNumber) => {
    const { pdf, settings } = this.state;
    const pages = get(pdf, '_pdfInfo.numPages', 0);
    const isUnderLastPage = settings.currentPage && settings.currentPage === pages && scrollPage === 1;
    if (!isUnderLastPage) {
      this.setState({ scrollPage, settings: this.updSettings('currentPage', scrollPage) });
    }
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

    return <Pdf pdf={pdf} forwardedRef={forwardedRef} defHeight={maxHeight} onScrollPage={this.handleScrollPage} {...this.commonProps} />;
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
    const { isLoading } = this.state;

    if (isLoading) {
      return;
    }

    return (
      <div
        className={classNames('ecos-doc-preview', className, {
          [`ecos-doc-preview_decreasing-step-${this.decreasingStep}`]: this.decreasingStep,
          'ecos-doc-preview_hidden': this.hiddenPreview
        })}
        style={{ height: this.height }}
      >
        {isLoading ? (
          <Loader className="ecos-doc-preview__loader" blur />
        ) : (
          <div
            ref={this.setBodyRef}
            className={classNames('ecos-doc-preview__content', { 'ecos-doc-preview__content_indents': !noIndents })}
          >
            {this.renderToolbar()}
            {this.renderViewer()}
            {this.renderMessage()}
          </div>
        )}
        <ReactResizeDetector handleWidth onResize={this.handleResizeWrapper} />
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, true);
const Img = getViewer(ImgViewer, false);

export default DocPreview;
