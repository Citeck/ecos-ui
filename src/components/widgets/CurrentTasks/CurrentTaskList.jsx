import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { selectStateCurrentTasksById } from '../../../selectors/tasks';
import { executeAction, setInlineTools } from '../../../actions/currentTasks';
import { getOutputFormat, isLastItem, t } from '../../../helpers/util';
import * as ArrayOfObjects from '../../../helpers/arrayOfObjects';
import { Grid, InlineTools } from '../../common/grid/index';
import { InfoText, Loader, Separator } from '../../common/index';
import { cleanTaskId, DisplayedColumns as DC, noData } from './utils';
import CurrentTaskInfo from './CurrentTaskInfo';
import BtnTooltipInfo from './BtnTooltipInfo';

class CurrentTaskList extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    previousHeight: PropTypes.number,
    isSmallMode: PropTypes.bool,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    className: ''
  };

  state = {
    previousHeight: 0
  };

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (props.previousHeight !== undefined && props.previousHeight !== state.previousHeight) {
      newState.previousHeight = props.previousHeight;
    }

    if (Object.keys(newState).length) {
      return newState;
    }

    return null;
  }

  getActions({ id: taskId, actions }) {
    const { executeAction, instanceRecord } = this.props;
    const upAct = action => ({ ...action, config: { ...action.config, noResultModal: true } });

    return isEmpty(actions) ? [] : actions.map(act => ({ ...act, onClick: () => executeAction(upAct(act), { taskId, instanceRecord }) }));
  }

  handleToolSettings = data => {
    const {
      row: { id },
      ...options
    } = data;

    return { actions: this.getActions({ id }), ...options };
  };

  renderEnum() {
    const { currentTasks, isMobile, forwardedRef, settings } = this.props;

    return (
      <div className="ecos-current-task-list_view-enum" ref={forwardedRef}>
        {currentTasks.map((item, i) => (
          <React.Fragment key={cleanTaskId(item.id)}>
            <CurrentTaskInfo task={item} isMobile={isMobile} actions={this.getActions(item)} settings={settings} />
            {!isLastItem(currentTasks, i) && <Separator noIndents />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  renderInlineTools = settings => {
    const { settingsInlineTools } = this.props;

    const inlineToolSettings = this.handleToolSettings(settings);

    return (
      <InlineTools
        className="ecos-current-task__table-inline-tools"
        inlineToolSettings={inlineToolSettings}
        withTooltip
        {...settingsInlineTools}
      />
    );
  };

  renderTable() {
    const { currentTasks, settings } = this.props;
    const dateFormat = get(settings, 'dateFormat');
    const formatTasks = currentTasks.map((task, i) => ({
      id: task.id,
      [DC.title.key]: task[DC.title.key] || noData,
      [DC.actors.key]: (
        <React.Fragment key={uniqueId(cleanTaskId(task.id))}>
          {task[DC.actors.key] || noData}
          {task.usersGroup && (
            <BtnTooltipInfo iconClass="icon-users" id={uniqueId(cleanTaskId(task.id))} isShow={task.isGroup} count={task.count}>
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
      [DC.deadline.key]: getOutputFormat(DC.deadline.format, task[DC.deadline.key], { dateFormat, isLocal: true }) || noData
    }));

    const cols = [DC.title, DC.actors, DC.deadline];
    const updCols = ArrayOfObjects.replaceKeys(cols, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);

    return (
      <Grid
        data={formatTasks}
        columns={gridCols}
        scrollable={false}
        className="ecos-current-task-list_view-table"
        noTopBorder
        inlineTools={this.renderInlineTools}
      />
    );
  }

  renderContent() {
    const { isLoading, currentTasks } = this.props;
    const { previousHeight } = this.state;
    const isEmptyList = isEmpty(currentTasks);

    if (isLoading) {
      return <Loader className="ecos-current-task-list__loader" style={{ height: `${previousHeight}px` }} />;
    }

    if (isEmptyList) {
      return <InfoText text={t('current-tasks-widget.no-tasks')} />;
    }

    // Cause: https://jira.citeck.ru/browse/ECOSUI-2970
    /*if (isSmallMode || isMobile) {
      return this.renderEnum();
    }*/

    return this.renderEnum();
  }

  render() {
    const { forwardedRef } = this.props;

    return <div ref={forwardedRef}>{this.renderContent()}</div>;
  }
}

const mapStateToProps = (state, context) => {
  const stateId = context.stateId;
  const reduxKey = get(context, 'reduxKey', 'currentTasks');
  const newState = state[reduxKey][stateId] || {};
  const currentTasksState = selectStateCurrentTasksById(state, stateId) || {};

  return {
    isLoading: currentTasksState.isLoading,
    isMobile: state.view.isMobile,
    currentTasks: currentTasksState.list || [],
    settingsInlineTools: {
      selectedRecords: newState.selectedRecords || [],
      selectAllPageRecords: newState.selectAllPageRecords
    }
  };
};

const mapDispatchToProps = (dispatch, { stateId, record }) => ({
  setInlineTools: inlineTools => dispatch(setInlineTools({ stateId, inlineTools })),
  executeAction: (action, data) => dispatch(executeAction({ stateId, action, record, ...data }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTaskList);
