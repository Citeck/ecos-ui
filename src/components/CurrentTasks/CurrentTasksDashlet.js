import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode, t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import CurrentTasks from './CurrentTasks';

import './style.scss';

class CurrentTasksDashlet extends React.Component {
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
    title: t('Текущие задачи'),
    classNameTasks: '',
    classNameDashlet: ''
  };

  className = 'ecos-current-task-list-dashlet';

  state = {
    isSmallMode: false,
    isUpdating: false
  };

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onReload = () => {
    this.setState({ isUpdating: true }, () => this.setState({ isUpdating: false }));
  };

  render() {
    const { id, title, config, classNameTasks, classNameDashlet, record } = this.props;
    const { isSmallMode, isUpdating } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        onReload={this.onReload}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
      >
        <ReactResizeDetector handleWidth onResize={this.onResize} />
        {!isUpdating && <CurrentTasks {...config} className={classNameTasks} record={record} isSmallMode={isSmallMode} stateId={id} />}
      </Dashlet>
    );
  }
}

export default CurrentTasksDashlet;
