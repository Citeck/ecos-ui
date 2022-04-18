import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import get from 'lodash/get';

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
      isOpened: !!props.showModelDefault
    };
  }

  _filter = React.createRef();

  componentDidMount() {
    this.getModel();
    this.designer = new BPMNModeler();
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

  handleReadySheet = mounted => {
    if (mounted) {
      const canvas = this.designer.modeler.get('canvas');
      console.log(canvas);
      //canvas.zoom('fit-viewport');
      this.designer.renderHeatmap({ canvas, heatmapdata });
    }
  };

  render() {
    const { model, isLoading } = this.props;
    const { isOpened } = this.state;

    return (
      <div className="ecos-process-statistics-model">
        {isLoading && <Loader blur />}
        <Caption small onClick={() => this.setState({ isOpened: !isOpened })}>
          {t(Labels.MODEL_TITLE)}
          <Icon className={classNames({ 'icon-small-up': isOpened, 'icon-small-down': !isOpened })} />
        </Caption>
        <Collapse isOpened={isOpened}>
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
