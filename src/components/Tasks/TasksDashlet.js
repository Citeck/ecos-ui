import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import Tasks from '../Tasks/Tasks';

import './style.scss';

class TasksDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    document: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameTasks: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sourceId: PropTypes.string.isRequired
    })
  };

  static defaultProps = {
    title: t('Задачи'),
    classNameTasks: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      isResizable: true,
      isRunReload: false
    };
  }

  className = 'ecos-task-list-dashlet';

  onReload = () => {
    this.setReload(false);
  };

  setReload = isDone => {
    this.setState({ isRunReload: !isDone });
  };

  render() {
    const { title, config, classNameTasks, classNameDashlet, document } = this.props;
    const { isResizable, isRunReload } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={isResizable}
        onReload={this.onReload}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
      >
        <Tasks {...config} className={classNameTasks} document={document} isRunReload={isRunReload} setReloadDone={this.setReload} />
      </Dashlet>
    );
  }
}

export default TasksDashlet;
