import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { isEmpty } from 'lodash';
import { getCurrentTaskList } from '../../actions/tasks';
import { selectDataCurrentTasksByStateId } from '../../selectors/tasks';
import { DefineHeight } from '../common';
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

  getCurrentTaskList = () => {
    const { getCurrentTaskList, stateId, record } = this.props;

    getCurrentTaskList({
      stateId,
      document: record
    });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  render() {
    const { currentTasks, isLoading, isMobile, isSmallMode, className, height, minHeight, maxHeight } = this.props;
    const childProps = {
      currentTasks,
      className,
      isLoading,
      isMobile,
      isSmallMode
    };
    const { contentHeight } = this.state;

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        <DefineHeight
          fixHeight={height}
          maxHeight={maxHeight}
          minHeight={minHeight}
          isMin={isLoading || isEmpty(currentTasks)}
          getOptimalHeight={this.setHeight}
        >
          <CurrentTaskList {...childProps} />
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTasks);
