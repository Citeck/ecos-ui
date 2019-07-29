import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import { Scrollbars } from 'react-custom-scrollbars';
import { getOptimalHeight } from '../../helpers/layout';
import { getCurrentTaskList } from '../../actions/tasks';
import { selectDataCurrentTasksByStateId } from '../../selectors/tasks';
import CurrentTaskList from './CurrentTaskList';

import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTasksState = selectDataCurrentTasksByStateId(state, context.stateId) || {};

  return {
    currentTasks: currentTasksState.list,
    isLoading: currentTasksState.isLoading,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getCurrentTaskList: payload => dispatch(getCurrentTaskList(payload))
});

class CurrentTasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false
  };

  state = {
    contentHeight: 0
  };

  className = 'ecos-current-task-list';

  componentDidMount() {
    this.getCurrentTaskList();
  }

  get height() {
    const { contentHeight } = this.state;
    const { height, minHeight, maxHeight, isLoading } = this.props;

    return getOptimalHeight(height, contentHeight, minHeight, maxHeight, isLoading);
  }

  getCurrentTaskList = () => {
    const { getCurrentTaskList, stateId, record } = this.props;

    getCurrentTaskList({
      stateId,
      document: record
    });
  };

  onResize = (w, contentHeight) => {
    this.setState({ contentHeight });
  };

  render() {
    const { currentTasks, isLoading, isMobile, isSmallMode, className } = this.props;
    const childProps = {
      currentTasks,
      className,
      isLoading,
      isMobile,
      isSmallMode
    };

    return (
      <Scrollbars
        style={{ height: this.height }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        <div className={`${this.className}__container`}>
          <ReactResizeDetector handleHeight onResize={this.onResize} />
          <CurrentTaskList {...childProps} />
        </div>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTasks);
