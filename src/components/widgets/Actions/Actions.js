import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';

import { DefineHeight } from '../../common/index';
import { selectDataRecordActionsByStateId } from '../../../selectors/recordActions';
import { getActions, resetActions, runExecuteAction } from '../../../actions/recordActions';
import ActionsList from './ActionsList';

import './style.scss';
import { selectIdentificationForView } from '../../../selectors/dashboard';
import { ActionModes } from '../../../constants';

const mapStateToProps = (state, { stateId, tabId }) => {
  console.log(state.pageTabs.tabs, tabId);
  const aState = selectDataRecordActionsByStateId(state, stateId) || {};

  return {
    dashboardId: selectIdentificationForView(state).id,
    list: aState.list,
    isLoading: aState.isLoading,
    isMobile: state.view.isMobile,
    isActivePage: !!state.pageTabs.tabs.find(t => t.id === tabId && t.isActive)
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
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onActionsChanged: PropTypes.func
  };

  static defaultProps = {
    className: ''
  };

  state = {
    contentHeight: 0
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

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderActionsList = () => {
    const { isLoading, className, list, isMobile, forwardedRef, onActionsChanged, isActivePage } = this.props;

    return (
      <ActionsList
        forwardedRef={forwardedRef}
        className={className}
        list={list}
        isLoading={isLoading}
        isMobile={isMobile}
        executeAction={this.executeAction}
        onActionsChanged={onActionsChanged}
        isActivePage={isActivePage}
      />
    );
  };

  render() {
    const { height, minHeight, list, isMobile } = this.props;
    const { contentHeight } = this.state;

    if (isMobile) {
      return this.renderActionsList();
    }

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className="ecos-actions__scroll"
        renderTrackVertical={props => <div {...props} className="ecos-actions__v-scroll" />}
      >
        <DefineHeight fixHeight={height} minHeight={minHeight} isMin={isEmpty(list)} getOptimalHeight={this.setHeight}>
          {this.renderActionsList()}
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Actions);
