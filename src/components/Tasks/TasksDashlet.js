import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isSmallMode, t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import Tasks from './Tasks';

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
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    classNameTasks: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isSmallMode: false,
      isRunReload: false,
      height: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      fitHeights: {}
    };
  }

  className = 'ecos-task-list-dashlet';

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ height });
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  onReload = () => {
    this.setReload(false);
  };

  setReload = isDone => {
    this.setState({ isRunReload: !isDone });
  };

  handleToggleContent = () => {
    const { isCollapsed } = this.state;

    this.setState({ isCollapsed: !isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed: !isCollapsed });
  };

  render() {
    const { id, title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isRunReload, isSmallMode, height, fitHeights, isCollapsed } = this.state;
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
        canDragging={canDragging}
        actionHelp={false}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.onChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Tasks
          {...config}
          className={classNameTasks}
          record={record}
          stateId={id}
          isRunReload={isRunReload}
          setReloadDone={this.setReload}
          isSmallMode={isSmallMode}
          height={height}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
        />
      </Dashlet>
    );
  }
}

export default TasksDashlet;
