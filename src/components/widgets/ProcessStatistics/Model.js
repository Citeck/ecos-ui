import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { getModel } from '../../../actions/processStatistics';

import './style.scss';
import BPMNModeler from '../../ModelEditor/BPMNModeler';
import { InfoText } from '../../common';
import { t } from '../../../helpers/export/util';

const mapStateToProps = (state, context) => {
  const ehState = (state, dId) => get(state, ['processStatistics', dId]);

  return {
    model: ehState.columns
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
    runUpdate: PropTypes.bool
  };

  static defaultProps = {
    className: ''
  };

  state = {
    contentHeight: 0,
    filters: []
  };

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

  handleReadySheet = () => {};

  render() {
    const { model } = this.props;

    if (model) {
      //BaseModeler.Sheet
      return <this.designer.Sheet diagram={model} onMounted={this.handleReadySheet} />;
    } else {
      return <InfoText text={t(`test`)} />;
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Model);
