import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { IcoBtn } from '../common/btns';
import { Dropdown, Input } from '../common/form';
import { getScaleModes, t } from '../../helpers/util';

const CUSTOM = 'custom';
const AUTO = 'auto';
const ZOOM_STEP = 0.15;

class Toolbar extends Component {
  static propTypes = {
    isPDF: PropTypes.bool.isRequired,
    className: PropTypes.string,
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPages: PropTypes.number.isRequired,
    onChangeSettings: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    inputRef: PropTypes.any
  };

  static defaultProps = {
    scale: AUTO,
    className: ''
  };

  className = 'ecos-doc-preview__toolbar';
  classNameGroup = 'ecos-doc-preview__toolbar-group';
  commonBtnClasses = 'ecos-btn_sq_sm ecos-btn_tight';

  constructor(props) {
    super(props);

    this.state = {
      scale: props.scale,
      currentPage: 1,
      isFullscreen: false,

      selectedZoom: '',
      isCustom: false
    };
  }

  componentDidMount() {
    const { scale = AUTO } = this.state;

    let foundScale = this.zoomOptions.find(el => el.scale === scale);
    foundScale = foundScale || { id: CUSTOM, scale };

    this.onChangeZoomOption(foundScale);
  }

  componentWillReceiveProps(nextProps) {
    const { scrollPage: currentPage, calcScale: scale } = nextProps;

    if (currentPage !== this.props.scrollPage) {
      this.setState({ currentPage });
    }

    if (scale !== this.props.calcScale) {
      this.setState({ scale });
    }
  }

  get zoomOptions() {
    const { selectedZoom, scale } = this.state;
    const zooms = getScaleModes();

    if (selectedZoom === CUSTOM) {
      zooms.push({ id: CUSTOM, title: `${Math.round(scale * 10000) / 100}%`, scale });
    }

    return zooms;
  }

  handlePrev = () => {
    const { currentPage } = this.state;

    this.goToPage(null, currentPage - 1);
  };

  handleNext = () => {
    const { currentPage } = this.state;

    this.goToPage(null, currentPage + 1);
  };

  goToPage = (event, page = 1) => {
    const { totalPages } = this.props;
    const { currentPage } = this.state;
    let newPage = page;

    if (event) {
      newPage = parseInt(event.target.value);
      newPage = Number.isNaN(newPage) ? currentPage : newPage;
      newPage = newPage > totalPages ? totalPages : newPage;
      newPage = newPage < 1 ? currentPage : newPage;
    }

    if (newPage) {
      this.setState({ currentPage: newPage });

      if (newPage > 0 && newPage <= totalPages) {
        this.onChangeSettings({ ...this.state, currentPage: newPage });
      }
    }
  };

  onChangeZoomOption = zoom => {
    const { id, scale } = zoom || {};

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

  setFullScreen = () => {
    this.props.onFullscreen(true);
  };

  onChangeSettings = newState => {
    const { ...output } = newState;

    this.props.onChangeSettings(output);
  };

  renderPager() {
    const { currentPage } = this.state;
    const { totalPages } = this.props;
    const pagerClass = `${this.className}-pager`;

    return (
      <div className={classNames(this.classNameGroup, pagerClass)}>
        <IcoBtn
          icon={'icon-left'}
          className={classNames(this.commonBtnClasses, `${pagerClass}-prev`, { 'ecos-btn_disabled': currentPage === 1 })}
          onClick={this.handlePrev}
        />
        {!!totalPages && (
          <Fragment>
            <Input type="text" onChange={this.goToPage} value={currentPage} className={classNames(`${pagerClass}-input`)} />
            <span className={`${pagerClass}-text`}> {`${t('doc-preview.out-of')} ${totalPages}`} </span>
          </Fragment>
        )}
        <IcoBtn
          icon={'icon-right'}
          className={classNames(this.commonBtnClasses, `${pagerClass}-next`, { 'ecos-btn_disabled': currentPage === totalPages })}
          onClick={this.handleNext}
        />
      </div>
    );
  }

  renderZoom() {
    const { scale, selectedZoom } = this.state;
    const zoomClass = `${this.className}-zoom`;

    return (
      <div className={classNames(`${this.classNameGroup} ${zoomClass}`)}>
        <IcoBtn
          icon={'icon-minus'}
          className={classNames(this.commonBtnClasses, { 'ecos-btn_disabled': scale <= ZOOM_STEP })}
          onClick={e => this.setScale(-1)}
        />
        <IcoBtn icon={'icon-plus'} className={this.commonBtnClasses} onClick={e => this.setScale(1)} />
        <Dropdown
          source={this.zoomOptions}
          value={selectedZoom}
          valueField={'id'}
          titleField={'title'}
          onChange={this.onChangeZoomOption}
          hideSelected={selectedZoom === CUSTOM}
        >
          <IcoBtn invert icon={'icon-down'} className={`${this.commonBtnClasses} ecos-btn_drop-down ${zoomClass}__btn-select`} />
        </Dropdown>
        <IcoBtn icon={'glyphicon glyphicon-fullscreen'} className={this.commonBtnClasses} onClick={this.setFullScreen} />
      </div>
    );
  }

  renderExtraBtns() {
    return (
      <div className={classNames(`${this.classNameGroup} ${this.className}-extra-btns`)}>
        <IcoBtn
          icon={'icon-download'}
          className={this.commonBtnClasses}
          onClick={this.props.onDownload}
          title={t('doc-preview.download')}
        />
      </div>
    );
  }

  render() {
    const { isPDF, inputRef, className } = this.props;

    return (
      <div ref={inputRef} className={classNames(this.className, className)}>
        {isPDF && this.renderPager()}
        {this.renderZoom()}
        {this.renderExtraBtns()}
      </div>
    );
  }
}

export default Toolbar;
