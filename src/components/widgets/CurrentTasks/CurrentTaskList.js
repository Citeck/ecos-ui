import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
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

  getActions({ id: taskId }) {
    const { actions, executeAction } = this.props;
    const upAct = action => ({ ...action, config: { ...action.config, noResultModal: true } });

    return isEmpty(actions) ? [] : actions.map(act => ({ ...act, onClick: () => executeAction(upAct(act), { taskId }) }));
  }

  handleHoverRow = data => {
    const {
      row: { id },
      ...options
    } = data;

    this.props.setInlineTools({ actions: this.getActions({ id }), ...options });
  };

  handleBlurRow = debounce(() => {
    this.props.setInlineTools({});
  }, 100);

  renderEnum() {
    const { currentTasks, isMobile, forwardedRef } = this.props;

    return (
      <div className="ecos-current-task-list_view-enum" ref={forwardedRef}>
        {currentTasks.map((item, i) => (
          <React.Fragment key={item.id}>
            <CurrentTaskInfo task={item} isMobile={isMobile} actions={this.getActions(item)} />
            {!isLastItem(currentTasks, i) && <Separator noIndents />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  renderInlineTools = () => {
    const { stateId } = this.props;

    return (
      <InlineTools
        className="ecos-current-task__table-inline-tools"
        stateId={stateId}
        reduxKey="currentTasks"
        toolsKey="inlineTools"
        withTooltip
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
      [DC.deadline.key]: getOutputFormat(DC.deadline.format, task[DC.deadline.key], { dateFormat }) || noData
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
        onMouseLeave={this.handleBlurRow}
        onChangeTrOptions={this.handleHoverRow}
        inlineTools={this.renderInlineTools}
      />
    );
  }

  renderContent() {
    const { isSmallMode, isLoading, currentTasks, isMobile } = this.props;
    const { previousHeight } = this.state;
    const isEmptyList = isEmpty(currentTasks);

    if (isLoading) {
      return <Loader className="ecos-current-task-list__loader" style={{ height: `${previousHeight}px` }} />;
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

const mapStateToProps = (state, context) => {
  const currentTasksState = selectStateCurrentTasksById(state, context.stateId) || {};

  return {
    isLoading: currentTasksState.isLoading,
    isMobile: state.view.isMobile,
    currentTasks: currentTasksState.list || [],
    actions: currentTasksState.actions || []
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
