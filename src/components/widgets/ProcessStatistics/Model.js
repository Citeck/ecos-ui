import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import { getModel } from '../../../actions/processStatistics';

import { Icon, InfoText, Loader, ResizableBox } from '../../common';
import { Caption, Checkbox } from '../../common/form';
import { t } from '../../../helpers/export/util';
import ModelViewer from '../../ModelViewer/ModelViewer';
import { Legend, Opacity, Zoomer } from '../../ModelViewer/tools';
import { getPreparedHeatItem, Labels } from './util';

import './style.scss';

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
    isShowHeatmap: PropTypes.bool,
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
      isOpened: !!props.showModelDefault,
      isModelMounting: false,
      isModelMounted: false,
      isHeatmapMounted: false,
      isActiveCount: false,
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

    if (!isEqual(prevProps.isShowHeatmap, this.props.isShowHeatmap)) {
      this.toggleHeatmap();
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

  handleInitSheet = isModelMounting => {
    this.setState({ isModelMounting });
  };

  handleReadySheet = ({ mounted, result }) => {
    this.setState({ isModelMounted: mounted, isModelMounting: false });

    if (mounted) {
      this.designer.setHeight(400);
      this.renderHeatmap();
    } else {
      console.warn({ result });
    }
  };

  renderHeatmap = () => {
    const { heatmapData, isShowHeatmap } = this.props;

    if (isShowHeatmap && !isEmpty(heatmapData)) {
      const data = this.getPreparedHeatData();

      this.designer.drawHeatmap({
        data,
        onChange: this.onChangeHeatmap,
        onMounted: () => this.setState({ isHeatmapMounted: true })
      });
    }
  };

  rerenderHeatmap = () => {
    const data = this.getPreparedHeatData();

    this.designer.heatmap.updateData({ data });
  };

  toggleHeatmap = () => {
    const { isModelMounted, isHeatmapMounted } = this.state;
    const { isShowHeatmap } = this.props;

    switch (true) {
      case isHeatmapMounted && !isShowHeatmap:
        this.designer.heatmap.toggleDisplay(true);
        break;
      case isHeatmapMounted && isShowHeatmap:
        this.designer.heatmap.toggleDisplay(false);
        break;
      case !isHeatmapMounted && isShowHeatmap && isModelMounted:
        this.renderHeatmap();
        break;
      default:
        break;
    }
  };

  redraw = height => {
    this.designer.setHeight(height);
    this.heatmapRef && this.heatmapRef.repaint();
  };

  //todo
  destroyHeatmap = () => {
    if (!this.heatmapRef) {
      return;
    }

    this.heatmapRef.removeData();
    this.heatmapRef.repaint();
    this.heatmapRef = null;
  };

  onChangeHeatmap = legendData => {
    this.setState({ legendData });
  };

  handleChangeCountFlag = data => {
    this.setState(data, this.rerenderHeatmap);
  };

  renderCountFlags = () => {
    return (
      <>
        <div className="ecos-process-statistics-model__filter-count">
          <Checkbox onChange={d => this.handleChangeCountFlag({ isActiveCount: d.checked })} />
          <span className="ecos-process-statistics-model__filter-count-label">{t(Labels.PANEL_ACTIVE_COUNT)}</span>
        </div>
        <div className="ecos-process-statistics-model__filter-count">
          <Checkbox onChange={d => this.handleChangeCountFlag({ isCompletedCount: d.checked })} />
          <span className="ecos-process-statistics-model__filter-count-label">{t(Labels.PANEL_COMPLETED_COUNT)}</span>
        </div>
      </>
    );
  };

  render() {
    const { model, isLoading, isShowHeatmap } = this.props;
    const { isOpened, isModelMounted, isModelMounting, legendData, isHeatmapMounted } = this.state;
    const isShow = isShowHeatmap && isHeatmapMounted;

    return (
      <div className="ecos-process-statistics-model">
        {(isLoading || isModelMounting) && <Loader blur />}
        <Caption small onClick={() => this.setState({ isOpened: !isOpened })}>
          {t(Labels.MODEL_TITLE)}
          <Icon className={classNames({ 'icon-small-up': isOpened, 'icon-small-down': !isOpened })} />
        </Caption>
        <Collapse isOpened={isOpened}>
          {!isLoading && !model && <InfoText noIndents text={t(Labels.NO_MODEL)} />}
          {model && !isModelMounted && !isModelMounting && <InfoText noIndents text={t(Labels.ERR_MODEL)} />}
          <div className="ecos-process-statistics-model__panel">
            <Zoomer instModelRef={this.designer} />
            {isShow && <Opacity instModelRef={this.designer} label={t(Labels.PANEL_OPACITY)} />}
            {isShow && this.renderCountFlags()}
            <div className="ecos-process-statistics-model__panel-delimiter" />
            {isShow && <Legend {...legendData} />}
          </div>
          <ResizableBox getHeight={this.redraw} resizable classNameResizer="ecos-process-statistics-model__sheet-resizer">
            {model && <this.designer.Sheet diagram={model} onInit={this.handleInitSheet} onMounted={this.handleReadySheet} />}
          </ResizableBox>
        </Collapse>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Model);
