import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { deepClone, getOutputFormat } from '../../helpers/util';
import EcosForm from '../EcosForm';
import { Headline } from '../common/form';
import { Grid } from '../common/grid';
import { Separator } from '../common';
import { DisplayedColumns, TaskPropTypes } from './utils';
import AssignmentPanel from './AssignmentPanel';

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

  onSubmitForm = () => {
    this.props.onSubmitForm();
  };

  renderDetailsGrid() {
    const details = deepClone(this.props.details);

    for (const key in details) {
      if (details.hasOwnProperty(key)) {
        const desc = ArrayOfObjects.getObjectByKV(DisplayedColumns, 'key', key);

        if (Object.keys(desc).length) {
          details[key] = getOutputFormat(desc.format, details[key]);
        }
      }
    }

    const arr = [details];
    const updCols = ArrayOfObjects.replaceKeys(DisplayedColumns, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);

    return <Grid data={arr} columns={gridCols} scrollable={true} className="ecos-task-ins_view-table" />;
  }

  renderDetailsEnum() {
    const { details } = this.props;
    const columns = ArrayOfObjects.sort(DisplayedColumns, 'order');

    return (
      <React.Fragment>
        {columns.map((item, i) => (
          <div className="ecos-task-ins_view-enum" key={details.id + i}>
            <div className="ecos-task-ins_view-enum-label">{item.label}</div>
            <div className="ecos-task-ins_view-enum-value">{getOutputFormat(item.format, details[item.key])}</div>
          </div>
        ))}
      </React.Fragment>
    );
  }

  render() {
    const { details, onAssignClick, className, isSmallMode } = this.props;
    const classBtn = classNames({ _fill: isSmallMode });

    return (
      <div className={classNames('ecos-task-ins', className)}>
        <Headline>{details.title}</Headline>
        <div className="ecos-task-ins__info-wrap">
          {!isSmallMode && this.renderDetailsGrid()}
          {isSmallMode && this.renderDetailsEnum()}
          <AssignmentPanel
            stateAssign={details.stateAssign}
            onClick={res => {
              onAssignClick({ taskId: details.id, ...res });
            }}
            narrow={!isSmallMode}
            className={classBtn}
          />
        </div>
        <Separator />
        <div className="ecos-task-ins__eform">
          <EcosForm record={details.id} formKey={details.formKey} onSubmit={this.onSubmitForm} saveOnSubmit />
        </div>
      </div>
    );
  }
}

export default TaskDetails;
