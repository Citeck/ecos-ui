import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { getModel } from '../../../actions/processStatistics';

import { Icon, InfoText, Loader, ResizableBox } from '../../common';
import { Caption } from '../../common/form';
import { t } from '../../../helpers/export/util';
import ModelViewer from '../../ModelViewer/ModelViewer';
import { Legend, Opacity, Zoomer } from '../../ModelViewer/tools';
import { DefSets, getPreparedHeatItem, Labels } from './util';

import './style.scss';
import ControlledCheckbox from '../../common/form/Checkbox/ControlledCheckbox';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    isLoading: psState.isLoadingModel,
    model: psState.model,
    heatmapData: psState.heatmapData
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
      isOpened: !!props.showModelDefault,
      isModelMounting: false,
      isModelMounted: false,
      isHeatmapMounted: false,
      isActiveCount: true,
      isCompletedCount: false,
      legendData: {}
    };
  }

  componentDidMount() {
    this.getModel();
    this.designer = new ModelViewer();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getModel();
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

    return heatmapData.map(item => getPreparedHeatItem(item, { isActiveCount, isCompletedCount }));
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
      //this.designer.drawInfoBlock({data: [1]})
      this.renderHeatmap();
    } else {
      console.warn({ result });
    }
  };

  renderHeatmap = () => {
    const { heatmapData } = this.props;
    const { isShowHeatmap } = this.state;
    console.log({ isShowHeatmap, heatmapData });
    if (isShowHeatmap && !isEmpty(heatmapData)) {
      const data = this.getPreparedHeatData();

      this.designer.drawHeatmap({
        data,
        onChange: this.handleChangeHeatmap,
        onMounted: () => this.setState({ isHeatmapMounted: true }),
        hasTooltip: true
      });
    }
  };

  reRenderHeatmap = () => {
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

  handleChangeCountFlag = data => {
    this.setState(data, this.reRenderHeatmap);
  };

  renderSwitchHeatmap = () => {
    const { isShowHeatmap } = this.state;
    const { heatmapData } = this.props;

    if (isEmpty(heatmapData)) {
      return null;
    }

    return (
      <div className="ecos-process-statistics-model__checkbox">
        <ControlledCheckbox checked={isShowHeatmap} onClick={this.handleToggleHeatmap} />
        <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_HEATMAP)}</span>
      </div>
    );
  };

  renderCountFlags = () => {
    const { isActiveCount, isCompletedCount } = this.state;

    return (
      <>
        <div className="ecos-process-statistics-model__checkbox">
          <ControlledCheckbox checked={isActiveCount} onClick={isActiveCount => this.handleChangeCountFlag({ isActiveCount })} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_ACTIVE_COUNT)}</span>
        </div>
        <div className="ecos-process-statistics-model__checkbox">
          <ControlledCheckbox checked={isCompletedCount} onClick={isCompletedCount => this.handleChangeCountFlag({ isCompletedCount })} />
          <span className="ecos-process-statistics-model__checkbox-label">{t(Labels.PANEL_COMPLETED_COUNT)}</span>
        </div>
      </>
    );
  };

  render() {
    const { model, isLoading } = this.props;
    const { isOpened, isModelMounted, isModelMounting, legendData, isHeatmapMounted, isShowHeatmap } = this.state;
    const isShow = isShowHeatmap && isHeatmapMounted;

    return (
      <div className="ecos-process-statistics-model">
        {(isLoading || isModelMounting) && <Loader blur />}
        <Caption small onClick={() => this.setState({ isOpened: !isOpened })}>
          {t(Labels.MODEL_TITLE)}
          <Icon className={classNames({ 'icon-small-up': isOpened, 'icon-small-down': !isOpened })} />
        </Caption>
        <Collapse isOpened={isOpened}>
          {!isLoading && !model && <InfoText text={t(Labels.NO_MODEL)} />}
          {model && !isModelMounted && !isModelMounting && <InfoText noIndents text={t(Labels.ERR_MODEL)} />}
          {model && (
            <>
              <div className="ecos-process-statistics-model__panel">
                <Zoomer instModelRef={this.designer} />
                {this.renderSwitchHeatmap()}
                {isShow && <Opacity defValue={DefSets.OPACITY} instModelRef={this.designer} label={t(Labels.PANEL_OPACITY)} />}
                {isShow && this.renderCountFlags()}
                <div className="ecos-process-statistics-model__panel-delimiter" />
                {isShow && <Legend {...legendData} />}
              </div>
              <ResizableBox getHeight={this.setHeight} resizable classNameResizer="ecos-process-statistics-model__sheet-resizer">
                <this.designer.Sheet
                  diagram={model}
                  onInit={this.handleInitSheet}
                  onMounted={this.handleReadySheet}
                  defHeight={DefSets.HEIGHT}
                />
              </ResizableBox>
            </>
          )}
        </Collapse>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Model);
