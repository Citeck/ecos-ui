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
    isUpdating: PropTypes.bool,
    isMobile: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onActionsChanged: PropTypes.func
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
    this.getActions();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isUpdating && this.props.isUpdating) {
      this.getActions();
    }
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

  getActions = () => {
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

    runExecuteAction({
      stateId,
      record,
      action
    });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderActionsList = () => {
    const { isLoading, className, list, isMobile, forwardedRef, onActionsChanged } = this.props;

    return (
      <ActionsList
        forwardedRef={forwardedRef}
        className={className}
        list={list}
        isLoading={isLoading}
        isMobile={isMobile}
        executeAction={this.executeAction}
        onActionsChanged={onActionsChanged}
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
