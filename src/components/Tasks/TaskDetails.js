import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EcosForm from '../EcosForm';
import { Caption } from '../common/form';
import { Grid } from '../common/grid';
import Separator from '../common/Separator/Separator';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { deepClone } from '../../helpers/util';
import { getDisplayedColumns, getOutputFormat, TasksPropTypes } from './utils';
import AssignmentPanel from './AssignmentPanel';
import './style.scss';

class TaskDetails extends React.Component {
  static propTypes = {
    details: PropTypes.shape(TasksPropTypes).isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    onAssignClick: PropTypes.func.isRequired,
    onSubmitForm: PropTypes.func.isRequired
  };

  static defaultProps = {
    details: {},
    className: '',
    isSmallMode: false,
    onAssignClick: () => {},
    onSubmitForm: () => {}
  };

  className = 'ecos-task-ins';
  displayedColumns = getDisplayedColumns();

  onSubmitForm = () => {
    this.props.onSubmitForm();
  };

  renderDetailsGrid() {
    const details = deepClone(this.props.details);

    for (const key in details) {
      if (details.hasOwnProperty(key)) {
        const desc = ArrayOfObjects.getObjectByKV(this.displayedColumns, 'key', key);

        if (Object.keys(desc).length) {
          details[key] = getOutputFormat(desc.format, details[key]);
        }
      }
    }

    const arr = [details];
    const updCols = ArrayOfObjects.replaceKeys(this.displayedColumns, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);
    const classes = `${this.className}_view-table`;

    return <Grid data={arr} columns={gridCols} scrollable={true} className={classes} />;
  }

  renderDetailsEnum() {
    const { details } = this.props;
    const classInfo = `${this.className}_view-enum`;
    const columns = ArrayOfObjects.sort(this.displayedColumns, 'order');

    return (
      <React.Fragment>
        {columns.map((item, i) => (
          <div className={classInfo} key={details.id + i}>
            <div className={`${classInfo}-label`}>{item.label}</div>
            <div className={`${classInfo}-value`}>{getOutputFormat(item.format, details[item.key])}</div>
          </div>
        ))}
      </React.Fragment>
    );
  }

  render() {
    const { details, onAssignClick, className, isSmallMode } = this.props;
    const classBtn = classNames({ _fill: isSmallMode });

    return (
      <div className={classNames(`${this.className}`, className)}>
        <Caption className={`${this.className}__title`} middle>
          {details.title}
        </Caption>

        <div className={`${this.className}__info-wrap`}>
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
        <div className={`${this.className}__eform`}>
          <EcosForm record={'eform'} formKey={details.formKey} onSubmit={this.onSubmitForm} />
        </div>
      </div>
    );
  }
}

export default TaskDetails;
