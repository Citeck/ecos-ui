import * as React from 'react';
import PropTypes from 'prop-types';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';

import { getOutputFormat, t } from '../../helpers/util';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { Grid } from '../common/grid';
import { InfoText, Loader, Separator } from '../common';
import { cleanTaskId, CurrentTaskPropTypes, DisplayedColumns as DC, noData } from './utils';
import CurrentTaskInfo from './CurrentTaskInfo';
import IconInfo from './IconInfo';

class CurrentTaskList extends React.Component {
  static propTypes = {
    currentTasks: PropTypes.arrayOf(PropTypes.shape(CurrentTaskPropTypes)).isRequired,
    className: PropTypes.string,
    height: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool
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
    const { currentTasks, isMobile } = this.props;

    return (
      <div className="ecos-current-task-list_view-enum">
        {currentTasks.map((item, i) => (
          <React.Fragment key={item.id + i}>
            <CurrentTaskInfo task={item} isMobile={isMobile} />
            <Separator noIndents />
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
          <IconInfo iconClass={'icon-usergroup'} id={uniqueId(cleanTaskId(task.id))} text={task.usersGroup} isShow={task.isGroup} />
        </React.Fragment>
      ),
      [DC.deadline.key]: getOutputFormat(DC.deadline.format, task[DC.deadline.key]) || noData
    }));

    const cols = [DC.title, DC.actors, DC.deadline];
    const updCols = ArrayOfObjects.replaceKeys(cols, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);

    return <Grid data={formatTasks} columns={gridCols} scrollable={false} className="ecos-current-task-list_view-table" />;
  }

  render() {
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
}

export default CurrentTaskList;
