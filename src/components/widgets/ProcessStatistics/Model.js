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
import { Caption } from '../../common/form';
import { t } from '../../../helpers/export/util';
import ModelViewer from '../../ModelEditor/ModelViewer';
import Legend from '../../ModelEditor/heatmap/Legend';
import { Labels } from './util';

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

  handleInitSheet = isModelMounting => {
    this.setState({ isModelMounting });
  };

  handleReadySheet = ({ mounted, result }) => {
    this.setState({ isModelMounted: mounted, isModelMounting: false });

    if (mounted) {
      this.designer.setHeight(500);
      this.renderHeatmap();
    } else {
      console.warn({ result });
    }
  };

  renderHeatmap = () => {
    const { heatmapData, isShowHeatmap } = this.props;

    if (isShowHeatmap && !isEmpty(heatmapData)) {
      const data = heatmapData.map(item => ({ id: item.id, value: item.activeCount }));
      this.designer.drawHeatmap({
        data,
        onChange: this.onChangeHeatmap,
        onMounted: () => this.setState({ isHeatmapMounted: true })
      });
    }
  };

  toggleHeatmap = () => {
    const { isModelMounted, isHeatmapMounted } = this.state;
    const { isShowHeatmap } = this.props;

    switch (true) {
      case isHeatmapMounted && !isShowHeatmap:
        this.designer.toggleDisplayHeatmap(true);
        break;
      case isHeatmapMounted && isShowHeatmap:
        this.designer.toggleDisplayHeatmap(false);
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

  render() {
    const { model, isLoading, isShowHeatmap } = this.props;
    const { isOpened, isModelMounted, isModelMounting, legendData, isHeatmapMounted } = this.state;

    return (
      <div className="ecos-process-statistics-model">
        {isLoading && <Loader blur />}
        <Caption small onClick={() => this.setState({ isOpened: !isOpened })}>
          {t(Labels.MODEL_TITLE)}
          <Icon className={classNames({ 'icon-small-up': isOpened, 'icon-small-down': !isOpened })} />
        </Caption>
        <Collapse isOpened={isOpened}>
          {!isLoading && !model && <InfoText noIndents text={t(Labels.NO_MODEL)} />}
          {model && !isModelMounted && !isModelMounting && <InfoText noIndents text={t(Labels.ERR_MODEL)} />}
          <div className="ecos-process-statistics-model__panel">
            <Legend {...legendData} className={classNames({ 'd-none': !isShowHeatmap || !isHeatmapMounted })} />
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
