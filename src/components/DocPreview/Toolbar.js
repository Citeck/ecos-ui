import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import Search from '../common/Search/Search';
import { IcoBtn } from '../common/btns';
import { Dropdown, Input } from '../common/form';
import { t, closeFullscreen } from '../../helpers/util';

const CUSTOM = 'custom';

class Toolbar extends Component {
  static propTypes = {
    isPDF: PropTypes.bool.isRequired,
    ctrClass: PropTypes.string.isRequired,
    scale: PropTypes.number,
    totalPages: PropTypes.number.isRequired,
    onChangeSettings: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired
  };

  static defaultProps = {
    scale: 1.5
  };

  constructor(props) {
    super(props);

    this.state = {
      scale: props.scale,
      searchText: '',
      currentPage: 1,
      isFullscreen: false,
      /*only current scope*/
      selectedZoom: '',
      isCustom: false
    };

    this.fullscreenchange = false;
  }

  componentDidMount() {
    window.addEventListener('fullscreenchange', this.onFullscreenchange, false);
    this.onChangeZoomOption(this.zoomOptions[0]);
  }

  /*componentWillReceiveProps(nextProps) {
    let newState = { ...this.state };
    let isChanged = false;
    if (nextProps.totalPages !== this.props.totalPages) {
      isChanged = true;
      newState.currentPage = this.props.totalPages ? 1 : '';
    }

    if (isChanged) {
      this.setState({ ...newState })
    }
  }*/

  componentWillUnmount() {
    window.removeEventListener('fullscreenchange', this.onFullscreenchange, false);
  }

  get zoomOptions() {
    const { selectedZoom, scale } = this.state;
    const zooms = [
      { id: 'auto', title: t('Automatic Zoom'), scale: 'auto' },
      { id: 'pageFit', title: t('Page Fit'), scale: 'page-fit' },
      { id: 'pageHeight', title: t('Page Height'), scale: 'page-height' },
      { id: 'pageWidth', title: t('Page Width'), scale: 'page-width' },
      { id: '50', title: '50%', scale: 0.5 },
      { id: '75', title: '75%', scale: 0.75 },
      { id: '100', title: '100%', scale: 1 },
      { id: '125', title: '125%', scale: 1.25 },
      { id: '150', title: '150%', scale: 1.5 },
      { id: '200', title: '200%', scale: 2 },
      { id: '300', title: '300%', scale: 3 },
      { id: '400', title: '400%', scale: 4 }
    ];

    if (selectedZoom === CUSTOM) {
      zooms.push({ id: CUSTOM, title: t(`Custom: ${Math.round(scale * 10000) / 100}%`), scale });
    }

    return zooms;
  }

  handlePrev = e => {
    let { currentPage } = this.state;

    this.goToPage(null, --currentPage);
  };

  handleNext = e => {
    let { currentPage } = this.state;

    this.goToPage(null, ++currentPage);
  };

  goToPage = (e, page) => {
    let currentPage = e ? e.target.value : page || 1;
    let newState = { ...this.state, currentPage };

    this.setState({ ...newState });
    this.onChangeSettings(newState);
  };

  onChangeZoomOption = ({ id, scale }) => {
    let newState = { ...this.state, selectedZoom: id, scale };

    this.setState(newState);
    this.onChangeSettings(newState);
  };

  setScale = direction => {
    const { scale } = this.state;
    const selectedZoom = CUSTOM;
    let currentScale = parseFloat(scale);

    if (Number.isNaN(currentScale)) {
      currentScale = 1; //fixme
    }

    currentScale += direction * 0.1;

    let newState = { ...this.state, selectedZoom, scale: currentScale };

    this.setState(newState);
    this.triggerScaleChange(newState);
  };

  triggerScaleChange = debounce(newState => {
    this.onChangeSettings(newState);
  }, 300);

  onFullscreenchange = e => {
    this.fullscreenchange = !this.fullscreenchange;

    if (!this.fullscreenchange) {
      this.setFullScreen(false);
      closeFullscreen();
    }
  };

  setFullScreen = flag => {
    let newState = { ...this.state, isFullscreen: flag };

    this.setState(newState);
    this.onChangeSettings(newState);
  };

  onChangeSettings = newState => {
    let { selectedZoom, isCustom, ...output } = newState;

    this.props.onChangeSettings(output);
  };

  render() {
    let { scale, searchText, currentPage, selectedZoom } = this.state;
    let { totalPages, totalPages: numPages, ctrClass, isPDF } = this.props;

    let _toolbar = `${ctrClass}__toolbar`;
    let _commonBtn = `ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-blue ecos-btn_tight`;

    return (
      <div className={classNames(_toolbar)}>
        {isPDF && (
          <div className={classNames(`${_toolbar}__pager`)}>
            <IcoBtn
              icon={'icon-left'}
              className={classNames(_commonBtn, `${_toolbar}__pager__prev`, { 'ecos-btn_disabled': currentPage === 1 })}
              onClick={this.handlePrev}
            />
            <Input type="text" onChange={this.goToPage} value={currentPage} className={classNames(`${_toolbar}__pager__input`)} />
            <span className={`${_toolbar}__pager_text`}> {t('pagination.from')} </span>
            <span className={`${_toolbar}__pager_text`}>{totalPages}</span>
            <IcoBtn
              icon={'icon-right'}
              className={classNames(_commonBtn, `${_toolbar}__pager__next`, { 'ecos-btn_disabled': currentPage === totalPages })}
              onClick={this.handleNext}
            />
          </div>
        )}
        <div className={classNames(`${_toolbar}__zoom`)}>
          <IcoBtn
            icon={'icon-minus'}
            className={classNames(_commonBtn, { 'ecos-btn_disabled': scale <= 0 })}
            onClick={e => this.setScale(-1)}
          />
          <IcoBtn icon={'icon-plus'} className={_commonBtn} onClick={e => this.setScale(1)} />
          <Dropdown
            source={this.zoomOptions}
            value={selectedZoom}
            valueField={'id'}
            titleField={'title'}
            onChange={this.onChangeZoomOption}
          >
            <IcoBtn invert={'true'} icon={'icon-down'} className={`${_commonBtn} ecos-btn_drop-down`} />
          </Dropdown>
          <IcoBtn icon={'glyphicon glyphicon-fullscreen'} className={_commonBtn} onClick={e => this.setFullScreen(true)} />
        </div>
        <div className={classNames(`${_toolbar}__download`)}>
          <IcoBtn icon={'icon-download'} className={_commonBtn} onClick={this.props.onDownload}>
            {t('Скачать')}
          </IcoBtn>
        </div>
        {false && isPDF && (
          <div className={classNames(`${_toolbar}__search`)}>
            <Search className={classNames(`${_toolbar}__search__input`)} />
          </div>
        )}
      </div>
    );
  }
}

export default Toolbar;
