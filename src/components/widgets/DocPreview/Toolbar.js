import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';

import { IcoBtn } from '../../common/btns/index';
import { Dropdown, Input } from '../../common/form/index';
import { getScaleModes, isExistValue, t } from '../../../helpers/util';

const CUSTOM = 'custom';
const ZOOM_STEP = 0.15;

const Labels = {
  OUT_OF: 'doc-preview.out-of',
  DOWNLOAD: 'doc-preview.download'
};

class Toolbar extends Component {
  static propTypes = {
    isPDF: PropTypes.bool.isRequired,
    className: PropTypes.string,
    fileName: PropTypes.string,
    scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPages: PropTypes.number.isRequired,
    onChangeSettings: PropTypes.func.isRequired,
    inputRef: PropTypes.any,
    downloadData: PropTypes.object
  };

  static defaultProps = {
    scale: '',
    className: '',
    downloadData: {},
    fileName: ''
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

  toolbarZoom = React.createRef();

  componentDidMount() {
    const { scale } = this.state;

    let foundScale = this.zoomOptions.find(el => el.scale === scale);
    foundScale = foundScale || { id: CUSTOM, scale };

    this.onChangeZoomOption(foundScale);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { scrollPage: currentPage, calcScale: scale } = this.props;

    if (isExistValue(currentPage) && currentPage !== prevState.currentPage) {
      this.setState({ currentPage });
    }

    if (isExistValue(scale) && scale !== prevProps.calcScale && scale !== prevState.scale) {
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
    const _scale = this.state.scale;
    const selectedZoom = CUSTOM;
    let scale = parseFloat(_scale);

    if (Number.isNaN(scale)) {
      scale = 1;
    }

    scale += direction * ZOOM_STEP;
    scale = scale < ZOOM_STEP ? ZOOM_STEP : scale;
    scale = +Number(scale).toFixed(2);

    let newState = { ...this.state, selectedZoom, scale };

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
          icon={'icon-left'}
          className={classNames('ecos-btn_sq_sm ecos-btn_tight ecos-doc-preview__toolbar-pager-prev', {
            'ecos-btn_disabled': currentPage === 1
          })}
          onClick={this.handlePrev}
        />
        {!!totalPages && (
          <>
            <Input type="text" onChange={this.goToPage} value={currentPage} className="ecos-doc-preview__toolbar-pager-input" />
            <span className="ecos-doc-preview__toolbar-pager-text"> {`${t(Labels.OUT_OF)} ${totalPages}`} </span>
          </>
        )}
        <IcoBtn
          icon={'icon-right'}
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
    const bottom = this.toolbarZoom.current ? this.toolbarZoom.current.getBoundingClientRect().bottom : 0;
    const maxH = bodyH - bottom - 10;

    return (
      <div className="ecos-doc-preview__toolbar-group ecos-doc-preview__toolbar-zoom" ref={this.toolbarZoom}>
        <IcoBtn
          icon={'icon-minus'}
          className={classNames('ecos-btn_sq_sm ecos-btn_tight', { 'ecos-btn_disabled': scale <= 0 })}
          onClick={() => this.setScale(-1)}
        />
        <IcoBtn icon={'icon-plus'} className="ecos-btn_sq_sm ecos-btn_tight" onClick={() => this.setScale(1)} />
        <Dropdown
          source={this.zoomOptions}
          value={selectedZoom}
          valueField={'id'}
          titleField={'title'}
          onChange={this.onChangeZoomOption}
          hideSelected={selectedZoom === CUSTOM}
          className="ecos-doc-preview__toolbar-zoom-dropdown"
          withScrollbar
          scrollbarHeightMax={`${maxH}px`}
        >
          <IcoBtn
            invert
            icon={'icon-down'}
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

    return downloadData && downloadData.link ? (
      <div className="ecos-doc-preview__toolbar-group ecos-doc-preview__toolbar-extra-btns">
        <a href={downloadData.link} download={downloadData.fileName || fileName} data-external>
          <IcoBtn icon="icon-download" className="ecos-btn_sq_sm ecos-btn_tight" title={t(Labels.DOWNLOAD)} />
        </a>
      </div>
    ) : null;
  }

  render() {
    const { isPDF, inputRef, className } = this.props;

    return (
      <div ref={inputRef} className={classNames('ecos-doc-preview__toolbar', className)}>
        {isPDF && this.renderPager()}
        {this.renderZoom()}
        {this.renderExtraBtns()}
      </div>
    );
  }
}

export default Toolbar;
