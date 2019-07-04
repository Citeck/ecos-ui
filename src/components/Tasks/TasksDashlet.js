import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode, t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import Tasks from '../Tasks/Tasks';

import './style.scss';

class TasksDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameTasks: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  };

  static defaultProps = {
    classNameTasks: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false,
      isRunReload: false
    };
  }

  className = 'ecos-task-list-dashlet';

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onReload = () => {
    this.setReload(false);
  };

  setReload = isDone => {
    this.setState({ isRunReload: !isDone });
  };

  render() {
    const { id, title, config, classNameTasks, classNameDashlet, record } = this.props;
    const { isRunReload, isSmallMode } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t('tasks-widget.title')}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        onReload={this.onReload}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
      >
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <Tasks
          {...config}
          className={classNameTasks}
          record={record}
          stateId={id}
          isRunReload={isRunReload}
          setReloadDone={this.setReload}
          isSmallMode={isSmallMode}
        />
      </Dashlet>
    );
  }
}

export default TasksDashlet;
