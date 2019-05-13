import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Search from '../common/Search/Search';
import { IcoBtn } from '../common/btns';
import { Dropdown, Input } from '../common/form';
import { t } from '../../helpers/util';

let _toolbar = `ecos-doc-preview-dashlet__toolbar`;
let _commonBtn = `ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-blue ecos-btn_tight`;

class Toolbar extends Component {
  static propTypes = {
    scale: PropTypes.number,
    totalPages: PropTypes.number.isRequired,
    onChangeSettings: PropTypes.func.isRequired
  };

  static defaultProps = {
    scale: 1.5,
    totalPages: 0,
    onChangeSettings: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      scale: props.scale,
      searchText: '',
      currentPage: '',
      selectedZoom: 0
    };
  }

  handlePrev = e => {
    this.onChangeSettings();
  };

  handleNext = e => {
    this.onChangeSettings();
  };

  goToPage = (e, page) => {
    let currentPage = e.target.value || page;

    this.setState({ currentPage });
    this.onChangeSettings();
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
    this.onChangeSettings();
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
    this.onChangeSettings();
  };

  setFullScreen = () => {};

  onChangeSettings = () => {
    if (this.props.onChangeSettings) {
      this.props.onChangeSettings({ ...this.state });
    }
  };

  render() {
    let { scale, searchText, currentPage, selectedZoom } = this.state;
    let { totalPages, totalPages: numPages } = this.props;

    return (
      <div className={classNames(_toolbar)}>
        <div className={classNames(`${_toolbar}__pager`)}>
          <IcoBtn icon={'icon-left'} className={`${_commonBtn} ${_toolbar}__pager__prev`} onClick={this.handlePrev} />
          <Input type="text" onChange={this.goToPage} value={currentPage} className={classNames(`${_toolbar}__pager__input`)} />
          <span className={`${_toolbar}__pager_text`}> {t('pagination.from')} </span>
          <span className={`${_toolbar}__pager_text`}>{totalPages}</span>
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
            <IcoBtn invert={'true'} icon={'icon-down'} className={`${_commonBtn} ecos-btn_drop-down`} />
          </Dropdown>
          <IcoBtn icon={'glyphicon glyphicon-fullscreen'} className={_commonBtn} onClick={this.setFullScreen} />
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
    );
  }
}

export default Toolbar;
