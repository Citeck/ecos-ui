import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import { getCurrentTaskList, initCurrentTasks, resetCurrentTaskList, setInlineTools } from '../../../actions/currentTasks';
import { selectStateCurrentTasksById } from '../../../selectors/tasks';
import CurrentTaskList from './CurrentTaskList';

import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTasksState = selectStateCurrentTasksById(state, context.stateId) || {};

  return {
    currentTasks: currentTasksState.list,
    isLoading: currentTasksState.isLoading,
    isMobile: state.view.isMobile,
    totalCount: currentTasksState.totalCount
  };
};

const mapDispatchToProps = (dispatch, { stateId, record }) => ({
  initCurrentTasks: () => dispatch(initCurrentTasks({ stateId, record })),
  getCurrentTaskList: () => dispatch(getCurrentTaskList({ stateId, record })),
  resetCurrentTaskList: () => dispatch(resetCurrentTaskList({ stateId })),
  setInlineTools: inlineTools => dispatch(setInlineTools({ stateId, inlineTools }))
});

class CurrentTasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setInfo: PropTypes.func,
    scrollbarProps: PropTypes.object
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false,
    setInfo: () => null
  };

  state = {
    contentHeight: 0
  };

  componentDidMount() {
    this.props.initCurrentTasks();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { totalCount, isLoading, runUpdate, setInfo } = this.props;

    if (totalCount !== prevProps.totalCount) {
      setInfo({ totalCount });
    }

    if (isLoading !== prevProps.isLoading) {
      setInfo({ isLoading });
    }

    if (runUpdate && !prevProps.runUpdate) {
      this.props.getCurrentTaskList();
    }
  }

  componentWillUnmount() {
    this.props.resetCurrentTaskList();
  }

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderCurrentTaskList = () => {
    const { className, forwardedRef, isSmallMode, stateId, record, height, isLoading } = this.props;

    return (
      <CurrentTaskList
        forwardedRef={forwardedRef}
        className={className}
        isSmallMode={isSmallMode}
        stateId={stateId}
        record={record}
        previousHeight={isLoading ? undefined : height}
      />
    );
  };

  render() {
    const { isMobile, scrollbarProps } = this.props;

    if (isMobile) {
      return this.renderCurrentTaskList();
    }

    return (
      <Scrollbars
        className="ecos-current-task-list"
        renderTrackVertical={props => <div {...props} className="ecos-current-task-list__v-scroll" />}
        {...scrollbarProps}
      >
        {this.renderCurrentTaskList()}
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTasks);
