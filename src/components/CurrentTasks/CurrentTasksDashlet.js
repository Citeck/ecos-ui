import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isSmallMode, t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
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
      isUpdating: false,
      fitHeights: {},
      height: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ height });
  };

  onReload = () => {
    this.setState({ isUpdating: true }, () => this.setState({ isUpdating: false }));
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  handleToggleContent = () => {
    const { isCollapsed } = this.state;

    this.setState({ isCollapsed: !isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed: !isCollapsed });
  };

  render() {
    const { id, title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isUpdating, height, fitHeights, isCollapsed } = this.state;
    const classDashlet = classNames('ecos-current-task-list-dashlet', classNameDashlet);

    return (
      <Dashlet
        title={title || t('current-tasks-widget.title')}
        bodyClassName="ecos-current-task-list-dashlet__body"
        className={classDashlet}
        resizable
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
        {!isUpdating && (
          <CurrentTasks
            {...config}
            className={classNameTasks}
            record={record}
            isSmallMode={isSmallMode}
            stateId={id}
            height={height}
            minHeight={fitHeights.min}
            maxHeight={fitHeights.max}
          />
        )}
      </Dashlet>
    );
  }
}

export default CurrentTasksDashlet;
