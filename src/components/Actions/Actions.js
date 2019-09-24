import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';
import { DefineHeight } from '../common';
import { selectDataRecordActionsByStateId } from '../../selectors/recordActions';
import { getActions, resetActions, runExecuteAction } from '../../actions/recordActions';
import ActionsList from './ActionsList';

import './style.scss';
import { selectIdentificationForView } from '../../selectors/dashboard';
import { ActionModes } from '../../constants';

const mapStateToProps = (state, context) => {
  const aState = selectDataRecordActionsByStateId(state, context.stateId) || {};

  return {
    dashboardId: selectIdentificationForView(state).id,
    list: aState.list,
    isLoading: aState.isLoading,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getActions: payload => dispatch(getActions(payload)),
  runExecuteAction: payload => dispatch(runExecuteAction(payload)),
  resetActions: payload => dispatch(resetActions(payload))
});

class Actions extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    dashboardId: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    isMobile: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    isLoading: false,
    isMobile: false
  };

  state = {
    contentHeight: 0
  };

  componentDidMount() {
    this.getEventsHistory();
  }

  componentWillUnmount() {
    const { resetActions, stateId } = this.props;

    resetActions({ stateId });
  }

  getContext() {
    const { dashboardId } = this.props;

    return {
      mode: ActionModes.DASHBOARD,
      dashboardId
    };
  }

  getEventsHistory = () => {
    const { getActions, record, stateId } = this.props;
    const context = this.getContext();

    getActions({
      stateId,
      record,
      context
    });
  };

  executeAction = action => {
    const { runExecuteAction, record, stateId } = this.props;
    const context = this.getContext();

    runExecuteAction({
      stateId,
      record,
      context,
      action
    });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  render() {
    const { isLoading, className, height, minHeight, list, isMobile } = this.props;
    const { contentHeight } = this.state;

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className="ecos-actions"
        renderTrackVertical={props => <div {...props} className="ecos-actions__v-scroll" />}
      >
        <DefineHeight fixHeight={height} minHeight={minHeight} isMin={isEmpty(list)} getOptimalHeight={this.setHeight}>
          <ActionsList list={list} isLoading={isLoading} className={className} executeAction={this.executeAction} isMobile={isMobile} />
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Actions);
