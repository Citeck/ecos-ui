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
      isResizable: true
    };
  }

  className = 'ecos-task-list-dashlet';

  onGoTo = () => {
    const {
      config: { link }
    } = this.props;

    window.location.href = link;
  };

  render() {
    const { title, config, classNameTasks, classNameDashlet, document } = this.props;
    const { isResizable } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={isResizable}
        onGoTo={this.onGoTo}
      >
        <Tasks {...config} className={classNameTasks} document={document} />
      </Dashlet>
    );
  }
}

export default TasksDashlet;
