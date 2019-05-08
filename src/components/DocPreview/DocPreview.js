import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PDFJS from 'pdfjs-dist';
import './DocPreview.scss';
import Search from '../common/Search/Search';
import { IcoBtn } from '../common/btns';
import { Dropdown, Input } from '../common/form';
import { t } from '../../helpers/util';

let _docPreview = 'ecos-doc-preview-dashlet';
let _toolbar = `${_docPreview}__toolbar`;
let _commonBtn = `ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-blue ecos-btn_tight`;

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired,
    scale: PropTypes.number
  };

  static defaultProps = {
    scale: 1.5
  };

  constructor(props) {
    super(props);

    this.state = {
      pdf: undefined,
      scale: props.scale,
      searchText: '',
      currentPage: null,
      selectedZoom: 0
    };
  }

  componentDidMount() {
    /*let { link } = this.props;

    PDFJS.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.0.489/build/pdf.worker.min.js';

    let loadingTask = PDFJS.getDocument(link);

    loadingTask.promise.then(
      doc => {
        console.log(`Document loaded: ${doc.numPages} page(s)`, doc);
        this.setState({ pdf: doc });
      },
      reason => {
        console.error(`Error during loading document: ${reason}`);
      }
    );*/
  }

  handlePrev = e => {};

  handleNext = e => {};

  goToPage = (e, page) => {
    let currentPage = e.target.value || page;

    this.setState({ currentPage });
  };

  get zoomOptions() {
    return [
      { id: 'auto', title: t('Automatic Zoom') },
      { id: 'pageFitOption', title: t('Page Fit') },
      { id: 'pageWidthOption', title: t('Page Width') },
      { id: '50', title: '50%' },
      { id: '75', title: '75%' },
      { id: '100', title: '100%' },
      { id: '125', title: '125%' },
      { id: '150', title: '150%' },
      { id: '200', title: '200%' },
      { id: '300', title: '300%' },
      { id: '400', title: '400%' }
    ];
  }

  onChangeZoomOption = e => {
    let selectedZoom = e.id;

    this.setScale();
    this.setState({ selectedZoom });
  };

  handleZoomOut = e => {
    this.setScale();
  };

  handleZoomIn = e => {
    this.setScale();
  };

  setScale = val => {
    let scale = 1.5;

    this.setState({ scale });
  };

  render() {
    let { pdf = {}, searchText, currentPage, selectedZoom } = this.state;
    let { _pdfInfo = {} } = pdf;
    let { numPages = 0 } = _pdfInfo;
    let arrayPages = [];

    while (numPages) {
      arrayPages.push(numPages--);
    }
    arrayPages.reverse();

    return (
      <div className={classNames(_docPreview)}>
        <div className={classNames(_toolbar)}>
          <div className={classNames(`${_toolbar}__pager`)}>
            <IcoBtn icon={'icon-left'} className={`${_commonBtn} ${_toolbar}__pager__prev`} onClick={this.handlePrev} />
            <Input type="text" onChange={this.goToPage} value={currentPage} className={classNames(`${_toolbar}__pager__input`)} />
            <span className={`${_toolbar}__pager_text`}> {t('pagination.from')} </span>
            <span className={`${_toolbar}__pager_text`}>{numPages}</span>
            <IcoBtn icon={'icon-right'} className={`${_commonBtn} ecos-btn_tight ${_toolbar}__pager__next`} onClick={this.handleNext} />
          </div>
          <div className={classNames(`${_toolbar}__zoom`)}>
            <IcoBtn icon={'icon-minus'} className={_commonBtn} onClick={this.handleZoomOut} />
            <IcoBtn icon={'icon-plus'} className={_commonBtn} onClick={this.handleZoomIn} />
            <Dropdown
              source={this.zoomOptions}
              value={selectedZoom}
              valueField={'id'}
              titleField={'title'}
              onChange={this.onChangeZoomOption}
            >
              <IcoBtn invert icon={'icon-down'} className={`${_commonBtn} ecos-btn_drop-down`} />
            </Dropdown>
          </div>
          <div className={classNames(`${_toolbar}__download`)}>
            <IcoBtn icon={'icon-download'} className={_commonBtn}>
              {t('Скачать')}
            </IcoBtn>
          </div>
          <div className={classNames(`${_toolbar}__search`)}>
            <Search className={classNames(`${_toolbar}__search__input`)} />
          </div>
        </div>
        <div className={classNames(`${_docPreview}__viewer`)}>
          {arrayPages.map(pageN => {
            /*<DocPage config={this.state} page={pageN}/>*/
          })}
        </div>
      </div>
    );
  }
}

export default DocPreview;
