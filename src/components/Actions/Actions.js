import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';
import { DefineHeight } from '../common';
import { selectDataRecordActionsByStateId } from '../../selectors/recordActions';
import { getActions, runExecuteAction } from '../../actions/recordActions';
import ActionsList from './ActionsList';

import './style.scss';
import { selectIdentificationForView } from '../../selectors/dashboard';

const mapStateToProps = (state, context) => {
  const aState = selectDataRecordActionsByStateId(state, context.stateId) || {};

  return {
    dashboardId: selectIdentificationForView(state).id,
    list: aState.list,
    isLoading: aState.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  getActions: payload => dispatch(getActions(payload)),
  runExecuteAction: payload => dispatch(runExecuteAction(payload))
});

class Actions extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    dashboardId: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    isLoading: false
  };

  state = {
    contentHeight: 0
  };

  componentDidMount() {
    this.getEventsHistory();
  }

  componentWillUnmount() {
    const { resetEventsHistory, stateId } = this.props;

    resetEventsHistory({ stateId });
  }

  getEventsHistory = () => {
    const { getActions, record, stateId, dashboardId } = this.props;

    getActions({
      stateId,
      record,
      dashboardId
    });
  };

  executeAction = action => {
    const { runExecuteAction, record, stateId } = this.props;

    runExecuteAction({
      stateId,
      record,
      action
    });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  render() {
    const { isLoading, className, height, minHeight, maxHeight, list } = this.props;
    const { contentHeight } = this.state;

    return (
      <>
        <Scrollbars
          style={{ height: contentHeight || '100%' }}
          className="ecos-actions"
          renderTrackVertical={props => <div {...props} className="ecos-actions__v-scroll" />}
        >
          <DefineHeight fixHeight={height} minHeight={minHeight} isMin={isLoading || isEmpty(list)} getOptimalHeight={this.setHeight}>
            <ActionsList list={list} isLoading={isLoading} className={className} executeAction={this.executeAction} />
          </DefineHeight>
        </Scrollbars>
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Actions);
