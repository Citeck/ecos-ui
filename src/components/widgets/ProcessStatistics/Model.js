import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import { getModel } from '../../../actions/processStatistics';

import { InfoText, Legend, ResizableBox, Scaler } from '../../common';
import { ControlledCheckbox, Range } from '../../common/form';
import { ScaleOptions } from '../../common/Scaler/util';
import { t } from '../../../helpers/export/util';
import BPMNViewer from '../../ModelViewer/BPMNViewer';
import { DefSets, getPreparedHeatItem, Labels } from './util';
import Section from './Section';

import './style.scss';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    isLoading: psState.isLoadingModel,
    model: psState.model,
    heatmapData: psState.heatmapData,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getModelData: payload => dispatch(getModel(payload))
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
    heatmapData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        activeCount: PropTypes.number,
        completedCount: PropTypes.number
      })
    )
  };

  static defaultProps = {
    className: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      isShowHeatmap: !!props.showHeatmapDefault,
      isShowCounters: !!props.showCountersDefault,
      isModelMounting: false,
      isModelMounted: false,
      isHeatmapMounted: false,
      isActiveCount: true,
      isCompletedCount: true,
      legendData: {},
      isTempHeatmapOff: false,
      opacity: DefSets.OPACITY
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
    this.handleMouseDown.cancel();
    this.handleMouseUp.cancel();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { showCountersDefault, showHeatmapDefault } = this.props;

    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getModel();
    }

    if (!!prevProps.heatmapData && !isEqual(prevProps.heatmapData, this.props.heatmapData)) {
      this.reRenderHeatmap();
      this.renderBadges();
    }

    if (prevProps.isLoading && !this.props.isLoading) {
      this.reRenderHeatmap();
    }

    if (prevProps.showHeatmapDefault !== showHeatmapDefault) {
      this.setState({ isShowHeatmap: showHeatmapDefault }, () => {
        showHeatmapDefault ? this.renderHeatmap() : this.switchHeatMapOff();
      });
    }

    if (prevProps.showCountersDefault !== showCountersDefault) {
      this.setState({ isShowCounters: showCountersDefault });
    }
  }

  getModel = () => {
    const { getModelData, record, stateId } = this.props;

    getModelData({ stateId, record });
  };

  getPreparedHeatData = () => {
    const { heatmapData } = this.props;
    const { isActiveCount, isCompletedCount } = this.state;

    if (!isActiveCount && !isCompletedCount) {
      return [];
    }

    return heatmapData.map(item => getPreparedHeatItem(item, { isActiveCount, isCompletedCount })).filter(item => item.value);
  };

  setHeight = height => {
    this.designer.setHeight(height);
  };

  handleInitSheet = isModelMounting => {
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

  toggleTempHeatmap = isTempHeatmapOff => {
    this.setState({ isTempHeatmapOff });
    this.handleToggleHeatmap();
  };

  switchHeatMapOff = () => {
    this.designer && this.designer.heatmap && this.designer.heatmap.updateData(new Set([]));
  };

  handleMouseDown = throttle(() => {
    this.state.isShowHeatmap && this.toggleTempHeatmap(true);
  }, 100);

  handleMouseUp = debounce(() => {
    this.state.isTempHeatmapOff && this.toggleTempHeatmap(false);
  }, 100);

  handleWheel = () => {
    let handle = null;

    if (handle) {
      clearTimeout(handle);
    }

    this.state.isShowHeatmap && this.toggleTempHeatmap(true);

    handle = setTimeout(this.handleStopWheel, 100);
  };

  handleStopWheel = () => {
    this.state.isTempHeatmapOff && this.toggleTempHeatmap(false);
  };

  renderBadges = () => {
    const { isActiveCount, isCompletedCount } = this.state;
    const keys = [];

    if (isActiveCount) {
      keys.push('activeCount');
    }

    if (isCompletedCount) {
      keys.push('completedCount');
    }

    this.designer.drawBadges({ data: this.props.heatmapData, keys });
  };

  renderHeatmap = () => {
    const { heatmapData } = this.props;
    const { isShowHeatmap } = this.state;

    if (isShowHeatmap && !isEmpty(heatmapData)) {
      const data = this.getPreparedHeatData();

      this.designer.drawHeatmap({
        data,
        onChange: this.handleChangeHeatmap,
        onMounted: () => {
          this.setState({ isHeatmapMounted: true });
          debounce(() => {
            this.handleChangeOpacity(DefSets.OPACITY);
            if (this.isFirstBoot) {
              this.handleClickZoom(ScaleOptions.FIT);
              this.isFirstBoot = false;
            }
          }, 100)();
        },
        hasTooltip: false
      });
    }
  };

  reRenderHeatmap = () => {
    if (!this.state.isShowHeatmap || !this.designer || !this.designer.heatmap) {
      return;
    }

    if (isEmpty(this.#heatmapData)) {
      this.#heatmapData = new Set([...this.getPreparedHeatData()]);
    }

    this.designer.heatmap.updateData(this.#heatmapData);
  };

  handleToggleHeatmap = () => {
    const { isModelMounted, isHeatmapMounted } = this.state;

    this.setState(
      ({ isShowHeatmap }) => ({ isShowHeatmap: !isShowHeatmap }),
      () => {
        const { isShowHeatmap } = this.state;

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
      }
    );
  };

  handleChangeHeatmap = legendData => {
    this.setState({ legendData });
    this.renderBadges();
  };

  handleChangeOpacity = value => {
    this.setState({ opacity: Number(value) });
    this.designer && this.designer.heatmap && this.designer.heatmap.setOpacity(value);
  };

  handleClickZoom = value => {
    this.designer.setZoom(value);
    this.reRenderHeatmap();
  };

  handleChangeCountFlag = data => {
    this.setState(data, this.reRenderHeatmap);
  };

  handleChangeSection = opened => {
    if (opened) {
      this.handleClickZoom(ScaleOptions.FIT);
    }
  };

  handleToggleShowCounters = () => this.setState(state => ({ isShowCounters: !state.isShowCounters }));

  renderSwitches = () => {
    const { isShowHeatmap, isShowCounters, isTempHeatmapOff } = this.state;
    const { heatmapData, isExtendedMode, showCountersDefault, showHeatmapDefault } = this.props;

    if (!isExtendedMode) {
      return null;
    }

    return (
      <div className="ecos-process-statistics-model__checkbox-group">
        {showCountersDefault && (
          <div className="ecos-process-statistics-model__checkbox" onClick={this.handleToggleShowCounters}>
            <ControlledCheckbox checked={isShowCounters} />
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
    const { isActiveCount, isCompletedCount, isShowCounters } = this.state;

    if (!isShowCounters) {
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
    const { model, isLoading, width, isMobile, displayHeatmapToolbar } = this.props;
    const { isModelMounted, isModelMounting, isShowHeatmap, isShowCounters, legendData, opacity } = this.state;

    const Sheet = this.designer && this.designer.renderSheet;

    return (
      <div
        className={classNames('ecos-process-statistics-model', {
          'ecos-process-statistics-model_x': width <= 500,
          'ecos-process-statistics-model_mobile': isMobile,
          'ecos-process-statistics-model_hidden-badges': !isShowCounters,
          'ecos-process-statistics-model_hidden-heatmap': !isShowHeatmap
        })}
      >
        <Section title={t(Labels.MODEL_TITLE)} isLoading={isLoading || isModelMounting} onChange={this.handleChangeSection} opened>
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
                  onInit={this.handleInitSheet}
                  onMounted={this.handleReadySheet}
                  defHeight={DefSets.HEIGHT}
                  onMouseDown={this.handleMouseDown}
                  onMouseUp={this.handleMouseUp}
                  onWheel={this.handleWheel}
                  zoom={ScaleOptions.FIT}
                />
              )}
              {!isLoading && displayHeatmapToolbar && (
                <div className={classNames('ecos-process-statistics-model__panel ecos-process-statistics-model__panel_footer')}>
                  {isShowHeatmap && <Range value={opacity} onChange={this.handleChangeOpacity} label={t(Labels.PANEL_OPACITY)} />}
                  {this.renderCountFlags()}
                  <div className="ecos-process-statistics__delimiter" />
                  {isShowHeatmap && <Legend {...legendData} />}
                </div>
              )}
            </ResizableBox>
          )}
        </Section>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Model);
