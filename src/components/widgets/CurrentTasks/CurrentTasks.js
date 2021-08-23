import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import isFunction from 'lodash/isFunction';

import { getCurrentTaskList, initCurrentTasks, resetCurrentTaskList, setInlineTools, setSettings } from '../../../actions/currentTasks';
import { selectStateCurrentTasksById } from '../../../selectors/tasks';
import CurrentTaskList from './CurrentTaskList';
import Settings from './Settings';

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
  initCurrentTasks: initData => dispatch(initCurrentTasks({ stateId, record, initData })),
  getCurrentTaskList: () => dispatch(getCurrentTaskList({ stateId, record })),
  resetCurrentTaskList: () => dispatch(resetCurrentTaskList({ stateId })),
  setInlineTools: inlineTools => dispatch(setInlineTools({ stateId, inlineTools })),
  setSettings: settings => dispatch(setSettings({ stateId, settings }))
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
    const { settings } = this.props;

    this.props.initCurrentTasks({ settings });
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

  handleSaveSettings = settings => {
    const { onSaveSettings, setSettings } = this.props;

    if (isFunction(onSaveSettings)) {
      onSaveSettings(settings);
    }

    setSettings(settings);
  };

  renderCurrentTaskList = () => {
    const { className, forwardedRef, isSmallMode, stateId, record, height, isLoading, settings } = this.props;

    return (
      <CurrentTaskList
        forwardedRef={forwardedRef}
        className={className}
        isSmallMode={isSmallMode}
        stateId={stateId}
        record={record}
        previousHeight={isLoading ? undefined : height}
        settings={settings}
      />
    );
  };

  renderSettings() {
    const { settings, isOpenSettings, onToggleSettings } = this.props;

    if (!isOpenSettings) {
      return null;
    }

    return <Settings isOpen settings={settings} onHide={onToggleSettings} onSave={this.handleSaveSettings} />;
  }

  render() {
    const { isMobile, scrollbarProps } = this.props;

    if (isMobile) {
      return this.renderCurrentTaskList();
    }

    return (
      <>
        <Scrollbars
          className="ecos-current-task-list"
          renderTrackVertical={props => <div {...props} className="ecos-current-task-list__v-scroll" />}
          {...scrollbarProps}
        >
          {this.renderCurrentTaskList()}
        </Scrollbars>

        {this.renderSettings()}
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTasks);
