/* eslint-disable */ // eslint break the initialization
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import { InfoText, Legend, ResizableBox, Scaler } from '../../common';
import { ControlledCheckbox, Range } from '../../common/form';
import { ScaleOptions } from '../../common/Scaler/util';
import BPMNViewer from '../../ModelViewer/BPMNViewer';
import { DefSets, getPreparedHeatItem, getPreparedKPIItem, Labels } from './util';
import { EXTENDED_MODE, KPI_MODE } from './constants';
import Section from './Section';

import { getModel, setNewData, changeFilter } from '@/actions/processStatistics';
import { t } from '@/helpers/util';

import './style.scss';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    isLoading: psState.isLoadingModel,
    model: psState.model,
    sectionPath: psState.sectionPath,
    heatmapData: psState.heatmapData,
    isNewData: psState.isNewData,
    KPIData: psState.KPIData,
    isMobile: state.view.isMobile,
  };
};

const mapDispatchToProps = (dispatch) => ({
  getModelData: (payload) => dispatch(getModel(payload)),
  setNewData: (payload) => dispatch(setNewData(payload)),
  changeFilter: (payload) => dispatch(changeFilter(payload)),
});

class Model extends React.Component {
  #heatmapData = new Set();

  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    width: PropTypes.number,
    showModelDefault: PropTypes.bool,
    runUpdate: PropTypes.bool,
    isLoading: PropTypes.bool,
    withPercentCount: PropTypes.bool,
    heatmapData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        activeCount: PropTypes.number,
        completedCount: PropTypes.number,
      }),
    ),
  };

  static defaultProps = {
    className: '',
    withPercentCount: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      isShowHeatmap: !!props.showHeatmapDefault,
      isShowBadges: !!props.showCountersDefault,
      isModelMounting: false,
      isModelMounted: false,
      isHeatmapMounted: false,
      isActiveCount: true,
      isCompletedCount: true,
      legendData: {},
      isTempHeatmapOff: false,
      opacity: DefSets.OPACITY,
    };
  }

  isFirstBoot = true;

  componentDidMount() {
    this.getModel();
    this.designer = new BPMNViewer();
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    // FIXME: There are no such methods, they cause errors without the conditional
    this.handleMouseDown.cancel && this.handleMouseDown.cancel();
    this.handleMouseUp.cancel && this.handleMouseUp.cancel();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { showCountersDefault, showHeatmapDefault, isNewData } = this.props;

    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getModel();
    }

    if (!prevProps.isNewData && isNewData) {
      this.rePaintHeatmap();
    }

    if (!isEqual(prevProps.formMode, this.props.formMode)) {
      this.#heatmapData = new Set();
      this.setState(
        {
          isShowCounters: this.props.formMode === KPI_MODE ? false : prevState.isShowCounters,
          isHeatmapMounted: false,
        },
        () => {
          if (get(this.designer, 'heatmap')) {
            this.designer.heatmap.destroy();
          }
          showHeatmapDefault ? this.renderHeatmap() : this.switchHeatMapOff();
          this.renderBadges();
        },
      );
    }

    if (prevProps.showHeatmapDefault !== showHeatmapDefault) {
      this.setState({ isShowHeatmap: showHeatmapDefault }, () => {
        showHeatmapDefault ? this.renderHeatmap() : this.switchHeatMapOff();
      });
    }

    if (prevProps.showCountersDefault !== showCountersDefault) {
      this.setState({ isShowBadges: showCountersDefault });
    }
  }

  getModel = () => {
    const { getModelData, record, stateId } = this.props;

    getModelData({ stateId, record });
  };

  getPreparedHeatData = () => {
    const { heatmapData, KPIData, formMode, stateId, setNewData } = this.props;
    const { isActiveCount, isCompletedCount } = this.state;

    if (formMode === KPI_MODE) {
      return KPIData.map((item) => getPreparedKPIItem(item)).filter((item) => item.value);
    }

    setNewData({ stateId, isNewData: false });

    if (!isActiveCount && !isCompletedCount) {
      return [];
    }

    return heatmapData.map((item) => getPreparedHeatItem(item, { isActiveCount, isCompletedCount })).filter((item) => item.value);
  };

  setHeight = (height) => {
    this.designer.setHeight(height);
  };

  handleInitSheet = (isModelMounting) => {
    this.setState({ isModelMounting });
  };

  handleReadySheet = ({ mounted, result }) => {
    this.setState({ isModelMounted: mounted, isModelMounting: false });

    if (mounted) {
      this.renderBadges();
      this.renderHeatmap();
    } else {
      console.warn({ result });
    }
  };

  toggleTempHeatmap = (isTempHeatmapOff) => {
    this.setState({ isTempHeatmapOff }, () => {
      this.handleToggleHeatmap();
    });
  };

  switchHeatMapOff = () => {
    this.designer && this.designer.heatmap && this.designer.heatmap.toggleDisplay(true);
  };

  handleMouseDown = () => {
    this.state.isShowHeatmap && this.toggleTempHeatmap(true);
  };

  handleMouseUp = () => {
    this.state.isTempHeatmapOff && this.toggleTempHeatmap(false);
  };

  handleWheel = () => {
    const { isShowHeatmap, isTempHeatmapOff } = this.state;

    if (isShowHeatmap && !isTempHeatmapOff) {
      this.setState({ isTempHeatmapOff: true, isShowHeatmap: false }, () => this.toggleHeatmap());
    }

    setTimeout(this.handleStopWheel, 100);
  };

  handleStopWheel = () => {
    const { isTempHeatmapOff } = this.state;

    if (isTempHeatmapOff) {
      this.setState({ isTempHeatmapOff: false, isShowHeatmap: true }, () => this.toggleHeatmap());
    }
  };

  renderBadges = () => {
    const { formMode, withPercentCount } = this.props;
    const { isActiveCount, isCompletedCount } = this.state;

    if (formMode !== EXTENDED_MODE) {
      return;
    }

    const keys = [];

    if (isActiveCount) {
      keys.push('activeCount');
    }

    if (isCompletedCount) {
      keys.push('completedCount');
    }

    this.designer.drawBadges({
      keys,
      data: this.props.heatmapData,
      withPercentCount,
    });
  };

  renderHeatmap = () => {
    const { heatmapData, setNewData, stateId, formMode } = this.props;
    const { isShowHeatmap, opacity } = this.state;

    if (!isEmpty(heatmapData)) {
      const data = this.getPreparedHeatData();
      this.#heatmapData = new Set([...data]);

      this.designer.drawHeatmap({
        data,
        onChange: this.handleChangeHeatmap,
        onMounted: () => {
          this.setState({ isHeatmapMounted: true });

          debounce(() => {
            this.handleChangeOpacity(opacity);
            if (this.isFirstBoot) {
              this.handleClickZoom(ScaleOptions.FIT);
              this.isFirstBoot = false;
            }
          }, 100)();
        },
        formMode,
        hasTooltip: false,
      });
    } else {
      setNewData({ stateId, isNewData: false });
    }

    if (!isShowHeatmap) {
      this.switchHeatMapOff();
    }
  };

  reRenderHeatmap = () => {
    const { formMode } = this.props;

    if (!this.state.isShowHeatmap || !this.designer || !this.designer.heatmap) {
      return;
    }

    this.#heatmapData = new Set([...this.getPreparedHeatData()]);

    this.designer.heatmap.updateData(this.#heatmapData, true, formMode);
    this.designer.heatmap.toggleDisplay(false);
  };

  rePaintHeatmap = () => {
    const { isSimpedMode } = this.props;

    if (isSimpedMode) {
      return;
    }

    if (!this.designer || !this.designer.heatmap) {
      return;
    }

    this.designer.heatmap.destroy();
    this.renderHeatmap();
    this.renderBadges();
  };

  handleToggleHeatmap = () => {
    this.setState(
      ({ isShowHeatmap }) => ({ isShowHeatmap: !isShowHeatmap }),
      () => this.toggleHeatmap(),
    );
  };

  toggleHeatmap = () => {
    const { isModelMounted, isHeatmapMounted, isShowHeatmap } = this.state;

    switch (true) {
      case isHeatmapMounted && !isShowHeatmap:
        this.switchHeatMapOff();
        break;
      case isShowHeatmap && isModelMounted:
        this.reRenderHeatmap();
        break;
      default:
        break;
    }
  };

  handleChangeHeatmap = (legendData) => {
    this.setState({ legendData }, () => {
      this.renderBadges();
    });
  };

  handleChangeOpacity = (value) => {
    this.setState({ opacity: Number(value) }, () => {
      this.designer && this.designer.heatmap && this.designer.heatmap.setOpacity(value);
    });
  };

  handleClickZoom = (value) => {
    this.designer.setZoom(value);
  };

  handleChangeCountFlag = (data) => {
    const { changeFilter, stateId, record } = this.props;
    let { isCompletedCount, isActiveCount } = data;

    if (isCompletedCount === undefined) {
      isCompletedCount = this.state.isCompletedCount;
    }

    if (isActiveCount === undefined) {
      isActiveCount = this.state.isActiveCount;
    }

    const predicate = {
      t: 'or',
      needValue: true,
      val: [
        {
          att: 'completed',
          t: isActiveCount ? 'empty' : 'not-empty',
        },
        {
          att: 'completed',
          t: isCompletedCount ? 'not-empty' : 'empty',
        },
      ],
    };

    changeFilter({ stateId, record, data: [predicate] });
    this.setState(data);
  };

  handleToggleShowCounters = () => this.setState((state) => ({ isShowBadges: !state.isShowBadges }));

  renderSwitches = () => {
    const { isShowHeatmap, isShowBadges, isTempHeatmapOff } = this.state;
    const { heatmapData, isSimpedMode, showCountersDefault, showHeatmapDefault, formMode } = this.props;

    if (isSimpedMode) {
      return null;
    }

    return (
      <div className="ecos-process-statistics-model__checkbox-group">
        {showCountersDefault && formMode !== KPI_MODE && (
          <div className="ecos-process-statistics-model__checkbox" onClick={this.handleToggleShowCounters}>
            <ControlledCheckbox checked={isShowBadges} />
            <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_COUNTERS)}</span>
          </div>
        )}
        {showHeatmapDefault && this.designer && this.designer.heatmap && !isEmpty(heatmapData) && (
          <div className="ecos-process-statistics-model__checkbox" onClick={this.handleToggleHeatmap}>
            <ControlledCheckbox checked={isTempHeatmapOff || isShowHeatmap} />
            <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_HEATMAP)}</span>
          </div>
        )}
      </div>
    );
  };

  renderCountFlags = () => {
    const { formMode } = this.props;
    const { isActiveCount, isCompletedCount, isShowCounters } = this.state;

    if (!isShowCounters && formMode !== EXTENDED_MODE) {
      return null;
    }

    return (
      <div className="ecos-process-statistics-model__checkbox-group">
        <div
          className="ecos-process-statistics-model__checkbox"
          onClick={() => this.handleChangeCountFlag({ isActiveCount: !isActiveCount })}
        >
          <ControlledCheckbox checked={isActiveCount} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_ACTIVE_COUNT)}</span>
        </div>
        <div
          className="ecos-process-statistics-model__checkbox"
          onClick={() => this.handleChangeCountFlag({ isCompletedCount: !isCompletedCount })}
        >
          <ControlledCheckbox checked={isCompletedCount} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_COMPLETED_COUNT)}</span>
        </div>
      </div>
    );
  };

  render() {
    const { model, sectionPath, isLoading, width, isMobile } = this.props;
    const {
      isModelMounted,
      isModelMounting,
      isShowHeatmap,
      isTempHeatmapOff,
      isShowBadges,
      isActiveCount,
      isCompletedCount,
      legendData,
      opacity,
    } = this.state;

    const Sheet = this.designer && this.designer.renderSheet;

    const zoomCenter = {
      x: 0,
      y: 0,
    };

    const showHeatmap = isTempHeatmapOff || isShowHeatmap;

    return (
      <div
        className={classNames('ecos-process-statistics-model', {
          'ecos-process-statistics-model_x': width <= 500,
          'ecos-process-statistics-model_mobile': isMobile,
          'ecos-process-statistics-model_hidden-active-count': !isActiveCount,
          'ecos-process-statistics-model_hidden-completed-count': !isCompletedCount,
          'ecos-process-statistics-model_hidden-badges': !isShowBadges,
          'ecos-process-statistics-model_hidden-heatmap': !isShowHeatmap,
          'ecos-process-statistics-model-kpi': this.props.formMode === KPI_MODE,
        })}
      >
        <Section title={t(Labels.MODEL_TITLE)} isLoading={isLoading || isModelMounting} opened>
          {!isLoading && !model && <InfoText text={t(Labels.NO_MODEL)} />}
          {model && !isModelMounted && !isModelMounting && <InfoText noIndents text={t(Labels.ERR_MODEL)} />}
          {isModelMounted && (
            <div className="ecos-process-statistics-model__panel">
              <Scaler onClick={this.handleClickZoom} />
              <div className="ecos-process-statistics__delimiter" />
              {this.renderSwitches()}
            </div>
          )}
          {model && (
            <ResizableBox getHeight={this.setHeight} resizable classNameResizer="ecos-process-statistics-model__sheet-resizer">
              {Sheet && (
                <Sheet
                  diagram={model}
                  sectionPath={sectionPath}
                  onInit={this.handleInitSheet}
                  onMounted={this.handleReadySheet}
                  defHeight={DefSets.HEIGHT}
                  onMouseDown={this.handleMouseDown}
                  onMouseUp={this.handleMouseUp}
                  onWheel={this.handleWheel}
                  zoom={ScaleOptions.FIT}
                  zoomCenter={zoomCenter}
                />
              )}
              {!isLoading && (
                <div className={classNames('ecos-process-statistics-model__panel ecos-process-statistics-model__panel_footer')}>
                  {showHeatmap && <Range value={opacity} onChange={this.handleChangeOpacity} label={t(Labels.PANEL_OPACITY)} />}
                  {this.renderCountFlags()}
                  <div className="ecos-process-statistics__delimiter" />
                  {showHeatmap && <Legend {...legendData} formMode={this.props.formMode} />}
                </div>
              )}
            </ResizableBox>
          )}
        </Section>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Model);
