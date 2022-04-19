import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import { getModel } from '../../../actions/processStatistics';

import { Icon, InfoText, Loader } from '../../common';
import { Caption } from '../../common/form';
import { t } from '../../../helpers/export/util';
import BPMNModeler from '../../ModelEditor/BPMNModeler';
import { Labels } from './util';

import './style.scss';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    isLoading: psState.isLoadingModel,
    model: psState.model
  };
};

const mapDispatchToProps = dispatch => ({
  getModelData: payload => dispatch(getModel(payload))
});

const heatmapdata = [
  { actId: 'StartEvent_1ew9rff', runCount: 12 },
  { actId: 'Activity_1epip7d', runCount: 20 },
  { actId: 'Activity_0q2hslg', runCount: 35 }
];

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
    this.designer = new BPMNModeler();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getModel();
    }

    if (!isEqual(prevProps.isShowHeatmap, this.props.isShowHeatmap) || !isEqual(prevState.isModelMounted, this.state.isModelMounted)) {
      if (this.state.isModelMounted) {
        if (this.props.isShowHeatmap) {
          this.renderHeatmap();
        } else {
          this.heatmapRef.removeData();
          this.heatmapRef.repaint();
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
  };

  renderHeatmap = () => {
    const canvas = this.designer.modeler.get('canvas');
    this.designer.renderHeatmap({ canvas, heatmapdata, heatmapRef: this.heatmapRef });
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
        <Collapse isOpened={isModelMounted && isOpened}>
          {!isLoading && !model && <InfoText text={t(Labels.NO_MODEL)} />}
          {model && <this.designer.Sheet diagram={model} onMounted={this.handleReadySheet} />}
        </Collapse>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Model);
