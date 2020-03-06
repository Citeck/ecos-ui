import * as React from 'react';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';

import { getOutputFormat, isLastItem, t } from '../../../helpers/util';
import * as ArrayOfObjects from '../../../helpers/arrayOfObjects';
import { Grid } from '../../common/grid/index';
import { InfoText, Loader, Separator } from '../../common/index';
import { cleanTaskId, CurrentTaskPropTypes, DisplayedColumns as DC, noData } from './utils';
import CurrentTaskInfo from './CurrentTaskInfo';
import BtnTooltipInfo from './BtnTooltipInfo';

class CurrentTaskList extends React.Component {
  static propTypes = {
    currentTasks: PropTypes.arrayOf(PropTypes.shape(CurrentTaskPropTypes)).isRequired,
    className: PropTypes.string,
    height: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    currentTasks: [],
    className: '',
    height: '100%',
    isSmallMode: false,
    isMobile: false,
    isLoading: false
  };

  renderEnum() {
    const { currentTasks, isMobile, forwardedRef } = this.props;

    return (
      <div className="ecos-current-task-list_view-enum" ref={forwardedRef}>
        {currentTasks.map((item, i) => (
          <React.Fragment key={item.id + i}>
            <CurrentTaskInfo task={item} isMobile={isMobile} />
            {!isLastItem(currentTasks, i) && <Separator noIndents />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  renderTable() {
    const { currentTasks } = this.props;
    const formatTasks = currentTasks.map((task, i) => ({
      [DC.title.key]: task[DC.title.key] || noData,
      [DC.actors.key]: (
        <React.Fragment key={uniqueId(cleanTaskId(task.id))}>
          {task[DC.actors.key] || noData}
          {task.usersGroup && (
            <BtnTooltipInfo
              iconClass="icon-usergroup"
              id={uniqueId(cleanTaskId(task.id))}
              isShow={task.isGroup}
              count={task.usersGroup.length}
            >
              {!task.usersGroup.length
                ? noData
                : task.usersGroup.map((user, position) => (
                    <div key={position} className="ecos-current-task__tooltip-list-item">
                      {user}
                    </div>
                  ))}
            </BtnTooltipInfo>
          )}
        </React.Fragment>
      ),
      [DC.deadline.key]: getOutputFormat(DC.deadline.format, task[DC.deadline.key]) || noData
    }));

    const cols = [DC.title, DC.actors, DC.deadline];
    const updCols = ArrayOfObjects.replaceKeys(cols, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);

    return <Grid data={formatTasks} columns={gridCols} scrollable={false} className="ecos-current-task-list_view-table" noTopBorder />;
  }

  renderContent() {
    const { isSmallMode, isLoading, currentTasks, isMobile } = this.props;
    const isEmptyList = isEmpty(currentTasks);

    if (isLoading) {
      return <Loader className="ecos-current-task-list__loader" />;
    }

    if (isEmptyList) {
      return <InfoText text={t('current-tasks-widget.no-tasks')} />;
    }

    if (isSmallMode || isMobile) {
      return this.renderEnum();
    }

    return this.renderTable();
  }

  render() {
    const { forwardedRef } = this.props;

    return <div ref={forwardedRef}>{this.renderContent()}</div>;
  }
}

export default CurrentTaskList;
