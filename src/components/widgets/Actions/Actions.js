import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import { ActionModes } from '../../../constants';
import { selectDataRecordActionsByStateId } from '../../../selectors/recordActions';
import { selectIdentificationForView } from '../../../selectors/dashboard';
import { getActions, resetActions, runExecuteAction } from '../../../actions/recordActions';
import ActionsList from './ActionsList';

import './style.scss';

const mapStateToProps = (state, { stateId }) => {
  const aState = selectDataRecordActionsByStateId(state, stateId) || {};

  return {
    dashboardId: selectIdentificationForView(state).id,
    list: aState.list,
    isLoading: aState.isLoading,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = (dispatch, { stateId, record }) => ({
  getActions: payload => dispatch(getActions({ ...payload, stateId, record })),
  runExecuteAction: payload => dispatch(runExecuteAction({ ...payload, stateId, record })),
  resetActions: () => stateId && dispatch(resetActions({ stateId }))
});

class Actions extends React.Component {
  static propTypes = {
    record: PropTypes.string,
    dashboardId: PropTypes.string,
    stateId: PropTypes.string,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    isMobile: PropTypes.bool,
    runUpdate: PropTypes.bool,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    scrollbarProps: PropTypes.object
  };

  static defaultProps = {
    className: ''
  };

  componentDidMount() {
    this.getActions();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getActions();
    }
  }

  componentWillUnmount() {
    const { resetActions } = this.props;

    resetActions();
  }

  getContext() {
    const { dashboardId } = this.props;

    return { mode: ActionModes.DASHBOARD, dashboardId };
  }

  getActions = () => {
    const { getActions } = this.props;
    const context = this.getContext();

    getActions({ context });
  };

  executeAction = action => {
    const { runExecuteAction } = this.props;

    runExecuteAction({ action });
  };

  renderActionsList = () => {
    const { isLoading, className, list, isMobile, forwardedRef, isActiveLayout } = this.props;

    return (
      <ActionsList
        forwardedRef={forwardedRef}
        className={className}
        list={list}
        isLoading={isLoading}
        isMobile={isMobile}
        executeAction={this.executeAction}
        isActiveLayout={isActiveLayout}
      />
    );
  };

  render() {
    const { isMobile, scrollbarProps } = this.props;

    if (isMobile) {
      return this.renderActionsList();
    }

    return (
      <Scrollbars
        className="ecos-actions__scroll"
        renderTrackVertical={props => <div {...props} className="ecos-actions__v-scroll" />}
        {...scrollbarProps}
      >
        {this.renderActionsList()}
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Actions);
