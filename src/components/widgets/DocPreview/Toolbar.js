import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isNil from 'lodash/isNil';

import { IcoBtn } from '../../common/btns/index';
import { Dropdown, Input } from '../../common/form/index';
import { getScaleModes, t } from '../../../helpers/util';
import { Labels } from './util';

const CUSTOM = 'custom';
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 4;

class Toolbar extends Component {
  static propTypes = {
    isPDF: PropTypes.bool.isRequired,
    className: PropTypes.string,
    fileName: PropTypes.string,
    filesList: PropTypes.array,
    fileValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPages: PropTypes.number.isRequired,
    inputRef: PropTypes.any,
    downloadData: PropTypes.object,
    onFullscreen: PropTypes.func,
    onChangeSettings: PropTypes.func.isRequired,
    onFileChange: PropTypes.func
  };

  static defaultProps = {
    scale: '',
    className: '',
    downloadData: {},
    fileName: '',
    filesList: [],
    onFileChange: () => null
  };

  constructor(props) {
    super(props);

    this.state = {
      scale: props.scale,
      currentPage: 1,
      selectedZoom: '',
      isCustom: false
    };
  }

  toolbarWrapperRef = React.createRef();
  toolbarZoomRef = React.createRef();

  componentDidMount() {
    const { scale } = this.state;

    let foundScale = this.zoomOptions.find(el => el.scale === scale);
    foundScale = foundScale || { id: CUSTOM, scale };

    this.onChangeZoomOption(foundScale);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { scrollPage: currentPage, calcScale: scale } = this.props;

    if (!isNil(currentPage) && currentPage !== prevState.currentPage) {
      this.setState({ currentPage });
    }

    if (!Number.isNaN(scale) && !isNil(scale) && scale !== prevProps.calcScale && scale !== prevState.scale) {
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

  get zoomDropdownStyle() {
    const wrapper = get(this.toolbarWrapperRef, 'current');
    const styles = {
      maxWidth: '145px'
    };

    if (!wrapper) {
      return styles;
    }

    const currentStyles = window.getComputedStyle(wrapper);

    styles.maxWidth = `calc(${styles.maxWidth} + ${currentStyles.marginLeft} + ${currentStyles.marginRight})`;

    return styles;
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
    const newState = { ...this.state, selectedZoom: id, scale };

    this.setState(newState);
    this.onChangeSettings(newState);
  };

  setScale = direction => {
    const _scale = this.state.scale;
    const selectedZoom = CUSTOM;
    let scale = parseFloat(_scale);

    if (Number.isNaN(scale)) {
      scale = 1;
    }

    scale += direction * ZOOM_STEP;
    scale = scale < ZOOM_STEP ? ZOOM_STEP : scale;
    scale = +Number(scale).toFixed(2);

    if (scale < MIN_ZOOM) {
      scale = MIN_ZOOM;
    }

    if (scale > MAX_ZOOM) {
      scale = MAX_ZOOM;
    }

    const newState = { ...this.state, selectedZoom, scale };

    this.setState(newState);
    this.triggerScaleChange(newState);
  };

  triggerScaleChange = debounce(newState => {
    this.onChangeSettings(newState);
  }, 300);

  setFullScreen = () => {
    this.props.onFullscreen();
  };

  onChangeSettings = newState => {
    const { ...output } = newState;

    this.props.onChangeSettings(output);
  };

  renderPager() {
    const { currentPage } = this.state;
    const { totalPages } = this.props;

    return (
      <div className="ecos-doc-preview__toolbar-group ecos-doc-preview__toolbar-pager">
        <IcoBtn
          icon={'icon-small-left'}
          className={classNames('ecos-btn_sq_sm ecos-btn_tight ecos-doc-preview__toolbar-pager-prev', {
            'ecos-btn_disabled': currentPage === 1
          })}
          onClick={this.handlePrev}
        />
        {!!totalPages && (
          <div className="ecos-doc-preview__toolbar-pager-text-wrapper">
            <Input type="text" onChange={this.goToPage} value={currentPage} className="ecos-doc-preview__toolbar-pager-input" />
            <span className="ecos-doc-preview__toolbar-pager-text"> {`${t(Labels.OUT_OF)} ${totalPages}`} </span>
          </div>
        )}
        <IcoBtn
          icon={'icon-small-right'}
          className={classNames('ecos-btn_sq_sm ecos-btn_tight ecos-doc-preview__toolbar-pager-next', {
            'ecos-btn_disabled': currentPage === totalPages
          })}
          onClick={this.handleNext}
        />
      </div>
    );
  }

  renderZoom() {
    const { scale, selectedZoom } = this.state;
    const bodyH = get(window, 'document.body.offsetHeight', 400);
    const bottom = this.toolbarZoomRef.current ? this.toolbarZoomRef.current.getBoundingClientRect().bottom : 0;
    const maxH = bodyH - bottom - 10;

    return (
      <div className="ecos-doc-preview__toolbar-group ecos-doc-preview__toolbar-zoom" ref={this.toolbarZoomRef}>
        <IcoBtn
          icon={'icon-small-minus'}
          className={classNames('ecos-btn_sq_sm ecos-btn_tight', { 'ecos-btn_disabled': scale <= MIN_ZOOM })}
          onClick={() => this.setScale(-1)}
        />
        <IcoBtn
          icon={'icon-small-plus'}
          className={classNames('ecos-btn_sq_sm ecos-btn_tight', {
            'ecos-btn_disabled': scale >= MAX_ZOOM
          })}
          onClick={() => this.setScale(1)}
        />
        <Dropdown
          source={this.zoomOptions}
          value={selectedZoom}
          valueField={'id'}
          titleField={'title'}
          onChange={this.onChangeZoomOption}
          hideSelected={selectedZoom === CUSTOM}
          className="ecos-doc-preview__toolbar-zoom-dropdown"
          controlClassName="ecos-doc-preview__toolbar-zoom-dropdown-control"
          withScrollbar
          scrollbarHeightMax={`${maxH}px`}
        >
          <IcoBtn
            invert
            style={this.zoomDropdownStyle}
            icon={'icon-small-down'}
            className="ecos-btn_sq_sm ecos-btn_tight ecos-btn_drop-down ecos-doc-preview__toolbar-zoom-selector"
          />
        </Dropdown>
        <IcoBtn
          icon="glyphicon glyphicon-fullscreen"
          className="ecos-doc-preview__toolbar-zoom-fullscreen ecos-btn_sq_sm ecos-btn_tight"
          onClick={this.setFullScreen}
        />
      </div>
    );
  }

  renderExtraBtns() {
    const { downloadData, fileName } = this.props;

    if (!downloadData && !downloadData.link) {
      return null;
    }

    return (
      <div className="ecos-doc-preview__toolbar-group ecos-doc-preview__toolbar-extra-btns">
        <a href={downloadData.link} download={downloadData.fileName || fileName} data-external>
          <IcoBtn icon="icon-download" className="ecos-btn_sq_sm ecos-btn_tight" title={t(Labels.DOWNLOAD)} />
        </a>
      </div>
    );
  }

  renderFilesList() {
    const { filesList, fileValue, onFileChange } = this.props;

    if (isArray(filesList) && filesList.length <= 1) {
      return null;
    }

    return (
      <div className="ecos-doc-preview__toolbar-group">
        <Dropdown
          withScrollbar
          className="ecos-doc-preview__toolbar-select"
          valueField="id"
          titleField="displayName"
          source={filesList}
          value={fileValue}
          onChange={onFileChange}
        />
      </div>
    );
  }

  render() {
    const { isPDF, inputRef, className } = this.props;

    return (
      <div ref={inputRef} className={classNames('ecos-doc-preview__toolbar', className)}>
        <div ref={this.toolbarWrapperRef} className="ecos-doc-preview__toolbar-wrapper">
          {this.renderFilesList()}
          {isPDF && this.renderPager()}
          {this.renderZoom()}
          {this.renderExtraBtns()}
        </div>
      </div>
    );
  }
}

export default Toolbar;
