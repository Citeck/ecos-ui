import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';

import * as ArrayOfObjects from '../../../helpers/arrayOfObjects';
import { getOutputFormat, t } from '../../../helpers/util';
import { DataFormatTypes } from '../../../constants';
import EcosForm from '../../EcosForm/index';
import { Headline } from '../../common/form/index';
import { Grid } from '../../common/grid/index';
import TaskAssignmentPanel from '../../TaskAssignmentPanel';
import { TaskPropTypes } from './utils';
import { ComponentKeys } from '../Components';

import './style.scss';

class TaskDetails extends React.Component {
  static propTypes = {
    details: PropTypes.shape(TaskPropTypes).isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    onSubmitForm: PropTypes.func.isRequired
  };

  static defaultProps = {
    details: {},
    className: '',
    isSmallMode: false,
    onAssignClick: () => {},
    onSubmitForm: () => {}
  };

  static gridColumns = [
    {
      key: 'started',
      label: t('tasks-widget.column.started'),
      order: 0,
      format: DataFormatTypes.DATE
    },
    {
      key: 'deadline',
      label: t('tasks-widget.column.deadline'),
      order: 1,
      format: DataFormatTypes.DATE
    },
    {
      key: 'sender',
      label: t('tasks-widget.column.sender'),
      order: 2
    },
    {
      key: 'actors',
      label: t('tasks-widget.column.actors'),
      order: 3
    },
    {
      key: 'lastcomment',
      label: t('tasks-widget.column.lastcomment'),
      order: 4
    }
  ];

  onSubmitForm = () => {
    this.props.onSubmitForm();
  };

  renderDetailsGrid() {
    const details = cloneDeep(this.props.details);

    for (const key in details) {
      if (details.hasOwnProperty(key)) {
        const desc = ArrayOfObjects.getObjectByKV(TaskDetails.gridColumns, 'key', key);

        if (Object.keys(desc).length) {
          details[key] = getOutputFormat(desc.format, details[key]);
        }
      }
    }

    const arr = [details];
    const updCols = ArrayOfObjects.replaceKeys(TaskDetails.gridColumns, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);

    return <Grid data={arr} columns={gridCols} scrollable={true} className="ecos-task-ins_view-table" />;
  }

  renderDetailsEnum() {
    const { details } = this.props;
    const columns = ArrayOfObjects.sort(TaskDetails.gridColumns, 'order');

    return (
      <>
        {columns.map((item, i) => (
          <div className="ecos-task-ins_view-enum" key={details.id + i}>
            <div className="ecos-task-ins_view-enum-label">{item.label}</div>
            <div className="ecos-task-ins_view-enum-value">{getOutputFormat(item.format, details[item.key])}</div>
          </div>
        ))}
      </>
    );
  }

  renderAssignmentPanel() {
    const { details, onAssignClick, isSmallMode } = this.props;

    return (
      <TaskAssignmentPanel
        narrow
        wrapperClassName={classNames('ecos-task__assign-btn__wrapper', {
          'ecos-task__assign-btn__wrapper_small-mode': isSmallMode
        })}
        className={classNames('ecos-task__assign-btn ecos-btn_brown2', {
          'ecos-task__assign-btn_small-mode': isSmallMode
        })}
        stateAssign={details.stateAssign}
        onClick={res => {
          onAssignClick({ taskId: details.id, ...res });
        }}
      />
    );
  }

  render() {
    const { details, className, isSmallMode } = this.props;

    return (
      <div className={classNames('ecos-task-ins', className)}>
        <Headline className="ecos-task-ins__title">
          <div title={details.title} className="ecos-task-ins__title-text">
            {details.title}
          </div>
          {!isSmallMode && this.renderAssignmentPanel()}
        </Headline>
        <div className="ecos-task-ins__info-wrap">
          {isSmallMode && this.renderAssignmentPanel()}
          {!isSmallMode && this.renderDetailsGrid()}
          {isSmallMode && this.renderDetailsEnum()}
        </div>
        <div className="ecos-task-ins__eform">
          <EcosForm
            record={details.id}
            formKey={details.formKey}
            onSubmit={this.onSubmitForm}
            saveOnSubmit
            options={{
              useNarrowButtons: true,
              fullWidthColumns: isSmallMode
            }}
            initiator={{
              type: 'widget',
              name: ComponentKeys.TASKS
            }}
          />
        </div>
      </div>
    );
  }
}

export default TaskDetails;
