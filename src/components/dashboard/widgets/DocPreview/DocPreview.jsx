import { DocScaleOptions } from '@citeck/constants';
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

import { InfoText, Loader } from '@/components/common';
import { Btn } from '@/components/common/btns';

import AudioViewer from './AudioViewer';
import ImgViewer from './ImgViewer';
import MarkdownViewer from './MarkdownViewer';
import PdfViewer from './PdfViewer';
import TextViewer from './TextViewer';
import VideoViewer from './VideoViewer';
import Toolbar from './Toolbar';
import getViewer from './Viewer';
import { Labels } from './util';

import { DocPreviewApi, normalizePreviewInfo } from '@/api/docPreview';
import { getOptimalHeight } from '@/helpers/layout';
import { t } from '@/helpers/util';

import './style.scss';

// 2.4.456 version of worker for 2.4.456 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.4.456/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}js/lib/pdf.worker.min.js?v=2.4.456`;

const decreasingSteps = [562, 387, 293];

/**
 * How long to keep asking whether a preview that is being prepared is ready: quickly at first,
 * because most conversions finish in seconds, then slowly, giving up after about two minutes. A
 * conversion that takes longer than that is better answered by a button the reader presses than by
 * a page that keeps asking on its own for the rest of the day.
 */
const PREVIEW_POLL_DELAYS_MS = [3000, 3000, 3000, 5000, 5000, ...Array(11).fill(10000)];

/** What to say when there is no preview, by the reason the backend gave for there being none. */
const MESSAGE_BY_STATUS = {
  processing: Labels.Status.PROCESSING,
  failed: Labels.Status.FAILED,
  unsupported: Labels.Status.UNSUPPORTED
};

class DocPreview extends Component {
  _toolbarRef = null;
  _bodyRef = null;
  _viewerRef = null;
  _wrapperRef = React.createRef();

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

  /**
   * The dashlet may be configured with a bare url and no record behind it, so there is no
   * `previewInfo` to normalize - the url has to describe itself. It goes through the very same
   * normalizer, whose legacy branch is written for exactly that: a link and nothing else.
   */
  /**
   * Whether a row is worth listing: something to render, or a reason and a file to offer instead.
   */
  static hasSomethingToShow(doc) {
    return !!get(doc, 'preview.url') || !!get(doc, 'preview.download.link');
  }

  /**
   * Whether two descriptors say the same thing about a document. Compared by what is shown and by
   * why nothing is: the preview of a record changes under the ui while it is open - a conversion
   * finishes, or fails - and that is the moment the screen has to be replaced.
   */
  static isSamePreview(a, b) {
    return get(a, 'url') === get(b, 'url') && get(a, 'kind') === get(b, 'kind') && get(a, 'status') === get(b, 'status');
  }

  static previewOfConfiguredLink({ link, fileName }) {
    return normalizePreviewInfo(link ? { url: link } : null, { fileName });
  }

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

  /**
   * Which viewer renders which kind. The registry is the whole extension point: a new kind is a new
   * entry here and a viewer to go with it, not another branch to thread through the component.
   */
  /** How many times the preview has been asked about since the record was opened. */
  previewPollAttempt = 0;

  previewPollTimer = null;

  viewerByKind = {
    pdf: () => this.pdfViewer(),
    text: () => this.textViewer(),
    markdown: () => this.markdownViewer(),
    video: () => this.mediaViewer(Video),
    audio: () => this.mediaViewer(Audio),
    image: () => this.imgViewer()
  };

  constructor(props) {
    super(props);

    this.state = {
      pdf: {},
      settings: { scale: props.scale },
      isLoading: true,
      scrollPage: props.firstPageNumber,
      recordId: props.recordId || this.getUrlRecordId(),
      mainRecordId: props.recordId || this.getUrlRecordId(),
      preview: DocPreview.previewOfConfiguredLink(props),
      contentHeight: 0,
      error: '',
      fileName: props.fileName,
      filesList: [],
      wrapperWidth: 0,
      needRecalculateScale: false,
      mainDoc: {}
    };

    this.bootstrapLink = !!props.link;
  }

  componentDidMount() {
    this.exist = true;
    document.addEventListener('fullscreenchange', this.handleFullscreenChange, false);
    this.loadPDF(this.state.preview);
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
        this.loadPDF(this.state.preview);
        this.runGetData();
        this.showFileBootstrap();
      });
      return;
    }

    const { clear, recordId: propRecordId, isLoading: propLoading, fileName: propFileName, runUpdate } = this.props;
    const { clear: prevClear, recordId: prevPropRecordId, isLoading: prevPropLoading, runUpdate: prevRunUpdate } = prevProps;

    let newState = {};
    let isBigUpdate = false;

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
    if (propLoading !== prevPropLoading && !this.isPDF) {
      newState.isLoading = propLoading;
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
      });
    }
  }

  componentWillUnmount() {
    this.exist = false;
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange, false);
    this.handleResizeWrapper.cancel();
    this.clearPreviewPoll();
  }

  // hiddenPreview is measured from the dom, which nothing else re-renders on
  handleFullscreenChange = () => this.exist && this.forceUpdate();

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
    return this.state.preview.kind === 'pdf';
  }

  /**
   * The original of what is on screen, and the name to save it under. A property of the descriptor
   * rather than a piece of state of its own: it is answered by the very query that says what to
   * show, so there is nothing to fetch separately and nothing that can fall out of step with it.
   */
  get downloadData() {
    return this.state.preview.download;
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
    const { preview, isLoading } = this.state;

    return !isLoading && !!preview.url && !this.message;
  }

  get message() {
    const { pdf, preview, error } = this.state;
    const { isLoading } = this.props;

    if (isLoading) {
      return null;
    }

    if (!isEmpty(error)) {
      return error;
    }

    // nothing to render, but the backend said why - which is worth more to the reader than the
    // blank "the document was not received" a broken picture used to produce
    if (preview.kind === 'none' && MESSAGE_BY_STATUS[preview.status]) {
      return t(MESSAGE_BY_STATUS[preview.status]);
    }

    if (pdf === undefined && !preview.url) {
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
    // A fullscreen descendant is out of flow, so the body measured below collapses to nothing.
    // Hiding the widget then hides the fullscreen element itself - `visibility` is inherited, and
    // a media player put fullscreen by its own controls stays a child of this tree.
    if (
      document.fullscreenElement &&
      get(this._wrapperRef, 'current.contains') &&
      this._wrapperRef.current.contains(document.fullscreenElement)
    ) {
      return false;
    }

    const heightTool = get(this._toolbarRef, 'offsetHeight', 0) + 10;
    const viewer = this._bodyRef && this._bodyRef.querySelector('.ecos-doc-preview__viewer');
    const heightBody = get(viewer, 'offsetHeight', 0);

    return heightTool >= heightBody && !this.message;
  }

  get hiddenToolbar() {
    const { filesList, preview, isLoading, error } = this.state;
    return isLoading ? false : filesList.length < 2 && (!!error || !preview.url);
  }

  get isBlockedByRecord() {
    return !this.state.mainRecordId;
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
    preview: normalizePreviewInfo(null),
    contentHeight: 0,
    error: '',
    fileName: '',
    isPreviewPollExhausted: false,
    needRecalculateScale: false
  });

  updSettings = (key, val, state = this.state) => ({ ...state.settings, [key]: val });

  runGetData = async () => {
    await this.fetchInfoMainDoc();
    await this.fetchFilesByRecord();
    this.showFileBootstrap();
    this.setState({ isLoading: false }, this.schedulePreviewPoll);
  };

  /**
   * Asks again while the backend says the preview is still being made. The wait grows and then
   * stops: past that point the reader is offered the button instead, so a conversion that never
   * finishes costs one request rather than a request every ten seconds forever.
   */
  schedulePreviewPoll = () => {
    this.clearPreviewPoll();

    if (get(this.state, 'preview.status') !== 'processing') {
      this.previewPollAttempt = 0;
      return;
    }

    const delay = PREVIEW_POLL_DELAYS_MS[this.previewPollAttempt];

    if (delay === undefined) {
      this.setState({ isPreviewPollExhausted: true });
      return;
    }

    this.previewPollAttempt += 1;
    this.previewPollTimer = setTimeout(() => this.exist && this.runGetData(), delay);
  };

  clearPreviewPoll = () => {
    if (this.previewPollTimer) {
      clearTimeout(this.previewPollTimer);
      this.previewPollTimer = null;
    }
  };

  handleRefreshPreview = () => {
    this.previewPollAttempt = 0;
    this.setState({ isPreviewPollExhausted: false }, this.runGetData);
  };

  fetchInfoMainDoc = async () => {
    if (this.isBlockedByRecord) {
      return;
    }

    const recordId = this.state.mainRecordId;
    // one descriptor answers both what to show and what to save it as; asking for the link and for
    // the name separately used to cost two round trips saying the same thing
    const preview = await DocPreviewApi.getPreview(recordId).catch(e => {
      console.error(e);
      return normalizePreviewInfo(null);
    });

    if (!this.exist) {
      return;
    }

    return new Promise(resolve => {
      this.setState({ mainDoc: { recordId, fileName: preview.download.fileName, preview } }, () => resolve());
    });
  };

  fetchFilesByRecord = async () => {
    return new Promise(async resolve => {
      const { filesList: oldFiles = [], mainDoc = {}, mainRecordId } = this.state;
      const showAllDocuments = get(this.props.toolbarConfig, 'showAllDocuments');
      const filesList = [];
      const newState = {};

      // a document with no preview is still a document: it has a reason to show and a file to
      // hand over, and dropping it here is what used to turn both into "there is no document"
      if (DocPreview.hasSomethingToShow(mainDoc)) {
        filesList.unshift(mainDoc);
      }

      if (!(this.isBlockedByRecord || !showAllDocuments)) {
        const list = await DocPreviewApi.getPreviews(mainRecordId);
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
    const { filesList = [], recordId, preview } = this.state;
    const currentRow = filesList.find(file => file.recordId === recordId);
    const isActual = !!currentRow && DocPreview.isSamePreview(currentRow.preview, preview);

    this.bootstrapLink = isActual && this.bootstrapLink;

    if (this.bootstrapLink || !filesList.length) {
      return;
    }

    // Either nothing has been shown yet, or the backend now answers differently about the document
    // on screen - the conversion it was waiting for has finished. Applied rather than offered:
    // the record is already in the state, so asking "is this a different document" would answer no
    // and leave the screen as it was.
    this.showFile(currentRow || get(filesList, '[0]'));
    this.bootstrapLink = true;
  };

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

  loadPDF = preview => {
    if (preview.kind !== 'pdf' || !preview.url) {
      return;
    }

    const loadingTask = pdfjs.getDocument(preview.url);
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

  handleFileChange = doc => {
    if (doc.recordId !== this.state.recordId) {
      this.showFile(doc);
    }
  };

  showFile = ({ fileName, recordId, preview }) => {
    // a stated reason for there being no preview is not an error; `message` speaks for it
    const error = !preview.url && preview.kind !== 'none' && t(Labels.Errors.FAILURE_FETCH);

    this.setState(
      {
        ...this.getCleanState(),
        isLoading: preview.kind === 'pdf',
        recordId,
        preview,
        error,
        fileName
      },
      () => {
        this.loadPDF(preview);
        this.schedulePreviewPoll();
      }
    );
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

    return (
      <Img
        src={this.state.preview.url}
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

  /**
   * A player takes only what is behind the url and what to call it: there is nothing to load, to
   * scale or to lay out, so video and audio differ by the element alone.
   */
  mediaViewer(Player) {
    const { forwardedRef } = this.props;
    const { preview, fileName } = this.state;

    return (
      <Player
        src={preview.url}
        ext={preview.ext}
        fileName={fileName}
        forwardedRef={forwardedRef}
        downloadData={this.downloadData}
        isLastDocument={this.isLastDocument}
        {...this.commonProps}
      />
    );
  }

  markdownViewer() {
    const { forwardedRef } = this.props;

    return (
      <MarkdownDoc
        src={this.state.preview.url}
        forwardedRef={forwardedRef}
        downloadData={this.downloadData}
        isLastDocument={this.isLastDocument}
        {...this.commonProps}
        onError={error => {
          console.error(error);
          this.setState({ error: t(Labels.Errors.FAILURE_FETCH) });
        }}
      />
    );
  }

  textViewer() {
    const { forwardedRef } = this.props;

    return (
      <Text
        src={this.state.preview.url}
        forwardedRef={forwardedRef}
        downloadData={this.downloadData}
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
    const { pdf, scrollPage, calcScale, filesList, fileName, recordId } = this.state;
    const pages = get(pdf, '_pdfInfo.numPages', 0);

    return (
      <Toolbar
        totalPages={pages}
        kind={this.state.preview.kind}
        scale={scale}
        scrollPage={scrollPage}
        calcScale={calcScale}
        inputRef={this.setToolbarRef}
        fileValue={recordId}
        fileName={fileName}
        filesList={filesList}
        downloadData={this.downloadData}
        onChangeSettings={this.handleChangeSettings}
        onFullscreen={this.handleFullscreen}
        onFileChange={this.handleFileChange}
        config={toolbarConfig}
        className={classNames({ 'd-none': this.hiddenToolbar })}
      />
    );
  }

  renderViewer() {
    const { preview, error } = this.state;

    if (!!error || preview.kind === 'none' || (!this.bootstrapLink && !preview.url)) {
      return null;
    }

    // A kind with no viewer of its own is shown as a picture, which is what this ui did with
    // anything it could not place back when it read the type out of the link.
    const viewer = this.viewerByKind[preview.kind] || this.viewerByKind.image;

    return viewer();
  }

  renderMessage() {
    const { downloadData } = this;
    const { isPreviewPollExhausted } = this.state;

    return (
      this.message && (
        <div className="ecos-doc-preview__info-block">
          <InfoText className="ecos-doc-preview__info-block-msg" text={this.message} />
          {isPreviewPollExhausted && (
            <Btn className="ecos-btn_narrow" onClick={this.handleRefreshPreview}>
              {t(Labels.REFRESH)}
            </Btn>
          )}
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
        ref={this._wrapperRef}
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
        <ReactResizeDetector handleWidth onResize={this.handleResizeWrapper} targetRef={this._wrapperRef} />
      </div>
    );
  }
}

const Pdf = getViewer(PdfViewer, true);
const Img = getViewer(ImgViewer, false);
const Text = getViewer(TextViewer, false);
const MarkdownDoc = getViewer(MarkdownViewer, false);
const Video = getViewer(VideoViewer, false);
const Audio = getViewer(AudioViewer, false);

export default DocPreview;
