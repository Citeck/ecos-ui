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
import ModelViewer from '../../ModelViewer';
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
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    width: PropTypes.number,
    showModelDefault: PropTypes.bool,
    runUpdate: PropTypes.bool,
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
      isTempHeatmapOff: false
    };
  }

  isFirstBoot = true;

  componentDidMount() {
    this.getModel();
    this.designer = new ModelViewer();
  }

  componentWillUnmount() {
    this.handleMouseDown.cancel();
    this.handleMouseUp.cancel();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getModel();
    }

    if (!!prevProps.heatmapData && !isEqual(prevProps.heatmapData, this.props.heatmapData)) {
      this.reRenderHeatmap();
      this.renderBadges();
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

  handleMouseDown = throttle(() => this.state.isShowHeatmap && this.toggleTempHeatmap(true), 100);

  handleMouseUp = debounce(() => this.state.isTempHeatmapOff && this.toggleTempHeatmap(false), 100);

  handleWheel = () => {
    this.handleMouseDown();
    this.handleMouseUp();
  };

  renderBadges = () => {
    this.designer.drawBadges({ data: this.props.heatmapData, keys: ['activeCount', 'completedCount'] });
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
    if (!this.state.isShowHeatmap || !this.designer.heatmap) {
      return;
    }

    const data = this.getPreparedHeatData();
    this.designer.heatmap.updateData(data);
  };

  handleToggleHeatmap = () => {
    const { isModelMounted, isHeatmapMounted } = this.state;

    this.setState(
      ({ isShowHeatmap }) => ({ isShowHeatmap: !isShowHeatmap }),
      () => {
        const { isShowHeatmap } = this.state;

        switch (true) {
          case isHeatmapMounted && !isShowHeatmap:
            this.designer.heatmap.destroy();
            this.setState({ isHeatmapMounted: false });
            break;
          case !isHeatmapMounted && isShowHeatmap && isModelMounted:
            this.renderHeatmap();
            break;
          default:
            break;
        }
      }
    );
  };

  handleChangeHeatmap = legendData => {
    this.setState({ legendData });
  };

  handleChangeOpacity = value => {
    this.designer.heatmap && this.designer.heatmap.setOpacity(value);
  };

  handleClickZoom = value => {
    this.designer.setZoom(value);
  };

  handleChangeCountFlag = data => {
    this.setState(data, this.reRenderHeatmap);
  };

  handleChangeSection = opened => {
    if (opened) {
      this.handleClickZoom(ScaleOptions.FIT);
    }
  };

  renderSwitches = () => {
    const { isShowHeatmap, isShowCounters, isTempHeatmapOff } = this.state;

    return (
      <div className="ecos-process-statistics-model__checkbox-group">
        <div className="ecos-process-statistics-model__checkbox">
          <ControlledCheckbox checked={isShowCounters} onClick={() => this.setState({ isShowCounters: !isShowCounters })} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_COUNTERS)}</span>
        </div>
        <div className="ecos-process-statistics-model__checkbox">
          <ControlledCheckbox checked={isTempHeatmapOff || isShowHeatmap} onClick={this.handleToggleHeatmap} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_HEATMAP)}</span>
        </div>
      </div>
    );
  };

  renderCountFlags = () => {
    const { isActiveCount, isCompletedCount } = this.state;

    return (
      <div className="ecos-process-statistics-model__checkbox-group">
        <div className="ecos-process-statistics-model__checkbox">
          <ControlledCheckbox checked={isActiveCount} onClick={isActiveCount => this.handleChangeCountFlag({ isActiveCount })} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_ACTIVE_COUNT)}</span>
        </div>
        <div className="ecos-process-statistics-model__checkbox">
          <ControlledCheckbox checked={isCompletedCount} onClick={isCompletedCount => this.handleChangeCountFlag({ isCompletedCount })} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_COMPLETED_COUNT)}</span>
        </div>
      </div>
    );
  };

  render() {
    const { model, isLoading, showModelDefault, heatmapData, width, isMobile, displayHeatmapToolbar } = this.props;
    const { isModelMounted, isModelMounting, isHeatmapMounted, isShowHeatmap, isShowCounters, isTempHeatmapOff, legendData } = this.state;

    return (
      <div
        className={classNames('ecos-process-statistics-model', {
          'ecos-process-statistics-model_x': width <= 500,
          'ecos-process-statistics-model_mobile': isMobile,
          'ecos-process-statistics-model_hidden-badges': !isShowCounters,
          'ecos-process-statistics-model_hidden-heatmap': !isShowHeatmap
        })}
      >
        <Section
          title={t(Labels.MODEL_TITLE)}
          isLoading={isLoading || isModelMounting}
          opened={showModelDefault}
          onChange={this.handleChangeSection}
        >
          {!isLoading && !model && <InfoText text={t(Labels.NO_MODEL)} />}
          {model && !isModelMounted && !isModelMounting && <InfoText noIndents text={t(Labels.ERR_MODEL)} />}
          {isModelMounted && (
            <div className="ecos-process-statistics-model__panel">
              <Scaler onClick={this.handleClickZoom} />
              <div className="ecos-process-statistics__delimiter" />
              {!isEmpty(heatmapData) && this.renderSwitches()}
            </div>
          )}
          {model && (
            <ResizableBox getHeight={this.setHeight} resizable classNameResizer="ecos-process-statistics-model__sheet-resizer">
              <this.designer.Sheet
                diagram={model}
                onInit={this.handleInitSheet}
                onMounted={this.handleReadySheet}
                defHeight={DefSets.HEIGHT}
                onMouseDown={this.handleMouseDown}
                onMouseUp={this.handleMouseUp}
                onWheel={this.handleWheel}
              />
              {!isLoading && displayHeatmapToolbar && (
                <div
                  className={classNames('ecos-process-statistics-model__panel ecos-process-statistics-model__panel_footer', {
                    invisible: !isTempHeatmapOff && !isHeatmapMounted
                  })}
                >
                  <Range value={DefSets.OPACITY} onChange={this.handleChangeOpacity} label={t(Labels.PANEL_OPACITY)} />
                  {this.renderCountFlags()}
                  <div className="ecos-process-statistics__delimiter" />
                  <Legend {...legendData} />
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
