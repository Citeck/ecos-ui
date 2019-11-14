import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pdfjs from 'pdfjs-dist';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { getOptimalHeight } from '../../helpers/layout';
import { isPDFbyStr, t } from '../../helpers/util';
import { DocPreviewApi } from '../../api';
import { InfoText, Loader } from '../common';
import Toolbar from './Toolbar';
import PdfViewer from './PdfViewer';
import ImgViewer from './ImgViewer';
import getViewer from './Viewer';

// 2.2.228 version of worker for 2.2.228 version of pdfjs-dist:
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.2.228/build/pdf.worker.min.js';
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
    byLink: PropTypes.bool,
    noIndents: PropTypes.bool,
    resizable: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    fileName: PropTypes.string,
    setUserScale: PropTypes.func
  };

  static defaultProps = {
    link: null,
    className: '',
    height: 'inherit',
    scale: 'auto',
    firstPageNumber: 1,
    recordKey: 'recordRef',
    byLink: false,
    noIndents: false,
    resizable: false,
    isCollapsed: false,
    fileName: '',
    setUserScale: () => null
  };

  state = {};
  refToolbar = React.createRef();
  refBody = React.createRef();

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
    const { link, isLoading, byLink, isCollapsed } = nextProps;
    const { recordId } = this.state;
    const newRecordId = this.getRecordId(nextProps);
    const isPdf = isPDFbyStr(link);
    let state = {};

    if (oldProps.isLoading !== isLoading && !isPdf) {
      state = { isLoading };
    }

    if (
      (byLink && oldProps.link !== link && isPdf) ||
      (byLink && oldProps.link !== link && isPdf && oldProps.isCollapsed && !isCollapsed)
    ) {
      state = { isLoading: true, pdf: {} };
      this.loadPDF(link);
    }

    if (oldProps.link !== link) {
      state.link = link;
    }

    if ((!byLink && recordId !== newRecordId) || (!byLink && oldProps.isCollapsed && !isCollapsed)) {
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
      getContentHeight: this.getContentHeight
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

    return getOptimalHeight(height, contentHeight, minHeight, maxHeight, !this.loaded) || '100%';
  }

  get hiddenTool() {
    const heightTool = get(this.refToolbar, 'current.offsetHeight', 0) + 10;
    const heightBody = get(this.refBody, 'current.offsetHeight', 0);

    return heightTool >= heightBody && !this.message;
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
      const error = link ? '' : t('doc-preview.error.failure-to-fetch');

      this.setState({ isLoading: false, link, error });

      if (link && isPDFbyStr(link)) {
        this.loadPDF(link);
      }
    });
  };

  loadPDF = link => {
    const { firstPageNumber } = this.props;
    const loadingTask = pdfjs.getDocument(link);

    this.setState({ scrollPage: firstPageNumber, isLoading: true });

    loadingTask.promise.then(
      pdf => {
        this.setState({ pdf, isLoading: false, scrollPage: firstPageNumber, error: '' });
      },
      err => {
        console.error(`Error during loading document: ${err}`);
        this.setState({ isLoading: false, error: t('doc-preview.error.failure-to-fetch') });
      }
    );
  };

  onChangeSettings = settings => {
    this.setState({ settings });
    this.props.setUserScale(settings.scale);
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

  getContentHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  pdfViewer() {
    const { pdf } = this.state;

    return <Pdf pdf={pdf} scrollPage={this.setScrollPage} {...this.commonProps} />;
  }

  imgViewer() {
    const { resizable } = this.props;
    const { link } = this.state;

    return (
      <Img
        src={link}
        resizable={resizable}
        {...this.commonProps}
        onError={() => {
          this.setState({ error: t('doc-preview.error.failure-to-fetch') });
        }}
      />
    );
  }

  renderToolbar() {
    const { scale, fileName } = this.props;
    const { pdf, scrollPage, calcScale, link } = this.state;
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
        inputRef={this.refToolbar}
        link={link}
        fileName={fileName}
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
    const message = this.message;

    return message && <InfoText text={message} />;
  }

  render() {
    const { className, noIndents } = this.props;
    const { isLoading } = this.state;

    return (
      <div
        className={classNames('ecos-doc-preview', className, { 'ecos-doc-preview_hidden': this.hiddenTool })}
        style={{ height: this.height }}
      >
        {!isLoading && (
          <div ref={this.refBody} className={classNames('ecos-doc-preview__content', { 'ecos-doc-preview__content_indents': !noIndents })}>
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

const Pdf = getViewer(PdfViewer, true);
const Img = getViewer(ImgViewer, false);

export default DocPreview;
