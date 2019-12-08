import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getAdaptiveNumberStr, isSmallMode, t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import CurrentTasks from './CurrentTasks';
import BaseWidget from '../BaseWidget';

import './style.scss';

class CurrentTasksDashlet extends BaseWidget {
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
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameTasks: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: true
  };

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isSmallMode: false,
      isUpdating: false,
      fitHeights: {},
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      totalCount: 0,
      isLoading: true
    };
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onReload = () => {
    this.setState({ isUpdating: true }, () => this.setState({ isUpdating: false }));
  };

  setInfo = data => {
    this.setState(data);
  };

  render() {
    const { title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isUpdating, userHeight, fitHeights, isCollapsed, totalCount, isLoading } = this.state;
    const classDashlet = classNames('ecos-current-task-list-dashlet', classNameDashlet);

    return (
      <Dashlet
        title={title || t('current-tasks-widget.title')}
        bodyClassName="ecos-current-task-list-dashlet__body"
        className={classDashlet}
        resizable
        contentMaxHeight={this.clientHeight}
        onReload={this.onReload}
        needGoTo={false}
        actionEdit={false}
        canDragging={canDragging}
        actionHelp={false}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        badgeText={getAdaptiveNumberStr(totalCount)}
        noBody={!totalCount && !isLoading}
      >
        {!isUpdating && (
          <CurrentTasks
            {...config}
            forwardedRef={this.contentRef}
            className={classNameTasks}
            record={record}
            isSmallMode={isSmallMode}
            stateId={record}
            height={userHeight}
            minHeight={fitHeights.min}
            maxHeight={fitHeights.max}
            setInfo={this.setInfo}
          />
        )}
      </Dashlet>
    );
  }
}

export default CurrentTasksDashlet;
