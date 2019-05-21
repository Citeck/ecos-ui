import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { IcoBtn } from '../common/btns';
import { Dropdown, Input } from '../common/form';
import { getScaleModes, closeFullscreen, t } from '../../helpers/util';

const CUSTOM = 'custom';
const ZOOM_STEP = 0.15;
const _commonBtn = `ecos-btn_narrow ecos-btn_tight`;

class Toolbar extends Component {
  static propTypes = {
    isPDF: PropTypes.bool.isRequired,
    ctrClass: PropTypes.string.isRequired,
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPages: PropTypes.number.isRequired,
    onChangeSettings: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired
  };

  static defaultProps = {
    scale: 'auto'
  };

  constructor(props) {
    super(props);

    this.state = {
      scale: props.scale,
      searchText: '',
      currentPage: 1,
      isFullscreen: false,

      selectedZoom: '',
      isCustom: false
    };

    this.fullscreenchange = false;
  }

  componentDidMount() {
    const { scale } = this.state;

    window.addEventListener('fullscreenchange', this.onFullscreenchange, false);
    this.onChangeZoomOption(this.zoomOptions.find(el => el.scale === scale));
  }

  componentWillReceiveProps(nextProps) {
    let { scrollPage: currentPage, calcScale: scale } = nextProps;

    if (currentPage !== this.props.scrollPage) {
      this.setState({ currentPage });
    }

    if (scale !== this.props.calcScale) {
      this.setState({ scale });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('fullscreenchange', this.onFullscreenchange, false);
  }

  get _toolbar() {
    let { ctrClass } = this.props;

    return `${ctrClass}__toolbar`;
  }

  get _group() {
    return `${this._toolbar}__group`;
  }

  get zoomOptions() {
    const { selectedZoom, scale } = this.state;
    const zooms = getScaleModes();

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
    let numInt = parseInt(currentPage);
    let newState = { ...this.state, currentPage };
    let { totalPages } = this.props;

    if (!Number.isNaN(numInt) || currentPage === '') {
      this.setState({ ...newState });

      if (+currentPage > 0 && +currentPage <= totalPages) {
        this.onChangeSettings(newState);
      }
    }
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
      currentScale = 1;
    }

    currentScale += direction * ZOOM_STEP;
    currentScale = +Number(currentScale).toFixed(2);

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

  renderPager() {
    let { currentPage } = this.state;
    let { totalPages } = this.props;
    let _toolbar = this._toolbar;
    let _group = this._group;

    return (
      <div className={classNames(`${_group} ${_toolbar}__pager`)}>
        <IcoBtn
          icon={'icon-left'}
          className={classNames(_commonBtn, `${_toolbar}__pager__prev`, { 'ecos-btn_disabled': currentPage === 1 })}
          onClick={this.handlePrev}
        />
        {!!totalPages && (
          <Fragment>
            <Input type="text" onChange={this.goToPage} value={currentPage} className={classNames(`${_toolbar}__pager__input`)} />
            <span className={`${_toolbar}__pager_text`}> {`${t('pagination.from')} ${totalPages}`} </span>
          </Fragment>
        )}
        <IcoBtn
          icon={'icon-right'}
          className={classNames(_commonBtn, `${_toolbar}__pager__next`, { 'ecos-btn_disabled': currentPage === totalPages })}
          onClick={this.handleNext}
        />
      </div>
    );
  }

  renderZoom() {
    let { scale, selectedZoom } = this.state;
    let _toolbar = this._toolbar;
    let _group = this._group;

    return (
      <div className={classNames(`${_group} ${_toolbar}__zoom`)}>
        <IcoBtn
          icon={'icon-minus'}
          className={classNames(_commonBtn, { 'ecos-btn_disabled': scale <= ZOOM_STEP })}
          onClick={e => this.setScale(-1)}
        />
        <IcoBtn icon={'icon-plus'} className={_commonBtn} onClick={e => this.setScale(1)} />
        <Dropdown source={this.zoomOptions} value={selectedZoom} valueField={'id'} titleField={'title'} onChange={this.onChangeZoomOption}>
          <IcoBtn invert={'true'} icon={'icon-down'} className={`${_commonBtn} ecos-btn_drop-down`} />
        </Dropdown>
        <IcoBtn icon={'glyphicon glyphicon-fullscreen'} className={_commonBtn} onClick={e => this.setFullScreen(true)} />
      </div>
    );
  }

  renderExtraBtns() {
    let _toolbar = this._toolbar;
    let _group = this._group;

    return (
      <div className={classNames(`${_group} ${_toolbar}__extra-btns`)}>
        <IcoBtn icon={'icon-download'} className={_commonBtn} onClick={this.props.onDownload}>
          {t('Скачать')}
        </IcoBtn>
      </div>
    );
  }

  render() {
    let { isPDF } = this.props;

    return (
      <div className={classNames(this._toolbar)}>
        {isPDF && this.renderPager()}
        {this.renderZoom()}
        {this.renderExtraBtns()}
      </div>
    );
  }
}

export default Toolbar;
