import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import { getModel } from '../../../actions/processStatistics';

import { Icon, InfoText, Loader, ResizableBox } from '../../common';
import { Caption } from '../../common/form';
import { t } from '../../../helpers/export/util';
import ModelViewer from '../../ModelEditor/ModelViewer';
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
    runUpdate: PropTypes.bool
  };

  static defaultProps = {
    className: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpened: !!props.showModelDefault,
      isModelMounted: false
    };
  }

  heatmapRef = null;

  componentDidMount() {
    this.getModel();
    this.designer = new ModelViewer();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getModel();
    }

    //todo switch
    if (!isEqual(prevProps.isShowHeatmap, this.props.isShowHeatmap) || !isEqual(prevState.isModelMounted, this.state.isModelMounted)) {
      if (this.state.isModelMounted) {
        if (this.props.isShowHeatmap) {
          //this.renderHeatmap();
        } else {
          //this.destroyHeatmap();
        }
      }
    }
  }

  getModel = () => {
    const { getModelData, record, stateId } = this.props;

    getModelData({ stateId, record });
  };

  handleReadySheet = mounted => {
    this.setState({ isModelMounted: mounted });
    this.designer.setHeight(500);
    this.renderHeatmap();
  };

  renderHeatmap = () => {
    if (this.props.heatmapData) {
      this.heatmapRef = this.designer.drawHeatmap(this.props.heatmapData);
    }

    // this.destroyHeatmap();
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

  render() {
    const { model, isLoading } = this.props;
    const { isOpened, isModelMounted } = this.state;

    return (
      <div className="ecos-process-statistics-model">
        {isLoading && <Loader blur />}
        <Caption small onClick={() => this.setState({ isOpened: !isOpened })}>
          {t(Labels.MODEL_TITLE)}
          <Icon className={classNames({ 'icon-small-up': isOpened, 'icon-small-down': !isOpened })} />
        </Caption>
        <Collapse isOpened={isOpened}>
          {!isLoading && !isModelMounted && <InfoText text={t(Labels.NO_MODEL)} />}
          <ResizableBox getHeight={this.redraw} resizable classNameResizer="ecos-process-statistics-model__sheet-resizer">
            {model && <this.designer.Sheet diagram={model} onMounted={this.handleReadySheet} />}
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
