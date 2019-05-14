import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Search from '../common/Search/Search';
import { IcoBtn } from '../common/btns';
import { Dropdown, Input } from '../common/form';
import { t } from '../../helpers/util';

const AUTO_SIZE = 'auto';
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
      currentPage: '',
      paramsZoom: {},
      /*only current scope*/
      selectedZoom: '',
      isCustom: false
    };
  }

  componentDidMount() {
    this.onChangeZoomOption(this.zoomOptions[0]);
  }

  get zoomOptions() {
    const width = AUTO_SIZE;
    const {
      paramsZoom: { height, width: customWidth = width },
      selectedZoom
    } = this.state;
    const zooms = [
      { id: 'auto', title: t('Automatic Zoom'), height: '70%', width },
      { id: 'pageFitOption', title: t('Page Fit'), height: '100%', width },
      { id: 'pageWidthOption', title: t('Page Width'), height: AUTO_SIZE, width: '100%' },
      { id: '50', title: '50%', height: '50%', width },
      { id: '75', title: '75%', height: '75%', width },
      { id: '100', title: '100%', height: '100%', width },
      { id: '125', title: '125%', height: '125%', width },
      { id: '150', title: '150%', height: '150%', width },
      { id: '200', title: '200%', height: '200%', width },
      { id: '300', title: '300%', height: '300%', width },
      { id: '400', title: '400%', height: '400%', width }
    ];

    if (selectedZoom === CUSTOM) {
      zooms.push({ id: CUSTOM, title: t(`Custom: ${height}%`), height, width: customWidth });
    }

    return zooms;
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

  onChangeZoomOption = e => {
    let { height, width } = e;
    let selectedZoom = e.id;

    this.setState({ selectedZoom, paramsZoom: { height, width } });
    this.onChangeSettings();
  };

  handleZoomOut = e => {
    this.setScale(false);
  };

  handleZoomIn = e => {
    this.setScale(true);
  };

  setScale = flag => {
    //let scale = 1.5;
    const { paramsZoom } = this.state;
    const selectedZoom = CUSTOM;
    let currentHeight = parseInt(paramsZoom.height);

    paramsZoom.width = AUTO_SIZE;

    if (!currentHeight) {
      currentHeight = 75; //fixme
    }

    if (flag) {
      currentHeight += 5;
    } else {
      currentHeight -= 5;
    }

    paramsZoom.height = currentHeight + '%';

    this.setState({ paramsZoom, selectedZoom });
    this.onChangeSettings();
  };

  setFullScreen = () => {};

  onChangeSettings = () => {
    let { selectedZoom, isCustom, ...output } = this.state;

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
            <IcoBtn icon={'icon-left'} className={`${_commonBtn} ${_toolbar}__pager__prev`} onClick={this.handlePrev} />
            <Input type="text" onChange={this.goToPage} value={currentPage} className={classNames(`${_toolbar}__pager__input`)} />
            <span className={`${_toolbar}__pager_text`}> {t('pagination.from')} </span>
            <span className={`${_toolbar}__pager_text`}>{totalPages}</span>
            <IcoBtn icon={'icon-right'} className={`${_commonBtn} ecos-btn_tight ${_toolbar}__pager__next`} onClick={this.handleNext} />
          </div>
        )}
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
          <IcoBtn icon={'icon-download'} className={_commonBtn} onClick={this.props.onDownload}>
            {t('Скачать')}
          </IcoBtn>
        </div>
        {isPDF && (
          <div className={classNames(`${_toolbar}__search`)}>
            <Search className={classNames(`${_toolbar}__search__input`)} />
          </div>
        )}
      </div>
    );
  }
}

export default Toolbar;
