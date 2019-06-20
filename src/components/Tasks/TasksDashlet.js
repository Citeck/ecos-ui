import * as React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import Tasks from '../Tasks/Tasks';

class TasksDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameTasks: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      id: PropTypes.string.isRequired
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
      isResizable: true
    };
  }

  //todo определять Small и изменять isResizable > false

  render() {
    const { title, config, classNameTasks, classNameDashlet } = this.props;
    const { isResizable } = this.state;

    return (
      <Dashlet title={title} bodyClassName={'ecos-tasks-dashlet__body'} className={classNameDashlet} resizable={isResizable}>
        <Tasks {...config} className={classNameTasks} />
      </Dashlet>
    );
  }
}

export default TasksDashlet;
