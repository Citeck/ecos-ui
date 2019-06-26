import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { Caption } from '../common/form';
import { Grid } from '../common/grid';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { deepClone } from '../../helpers/util';
import { DisplayedColumns, getOutputFormat, TasksPropTypes } from './utils';
import AssignmentPanel from './AssignmentPanel';
import './style.scss';

class TaskDetails extends React.Component {
  static propTypes = {
    details: PropTypes.shape(TasksPropTypes).isRequired,
    className: PropTypes.string,
    onAssignClick: PropTypes.func.isRequired,
    onSubmitForm: PropTypes.func.isRequired
  };

  static defaultProps = {
    details: {},
    className: '',
    onAssignClick: () => {},
    onSubmitForm: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false
    };
  }

  className = 'ecos-task-details';

  onResize = width => {
    this.setState({ isSmallMode: width <= 300 });
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
    const classes = `${this.className}_view-table`;

    return <Grid data={arr} columns={gridCols} scrollable={true} className={classes} />;
  }

  renderDetailsEnum() {
    const { details } = this.props;
    const classDetail = `${this.className}_view-enum`;
    const columns = ArrayOfObjects.sort(DisplayedColumns, 'order');

    return (
      <React.Fragment>
        {columns.map((item, i) => (
          <div className={classDetail} key={details.id + i}>
            <div className={`${classDetail}-label`}>{item.label}</div>
            <div className={`${classDetail}-value`}>{getOutputFormat(item.format, details[item.key])}</div>
          </div>
        ))}
      </React.Fragment>
    );
  }

  render() {
    const { details, onAssignClick, className } = this.props;
    const { isSmallMode } = this.state;
    const classBtn = classNames({ _fill: isSmallMode });

    return (
      <div className={classNames(`${this.className}`, className)}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <Caption className={`${this.className}__title`} middle>
          {details.title}
        </Caption>

        <div className={`${this.className}__wrapper`}>
          {!isSmallMode && this.renderDetailsGrid()}
          {isSmallMode && this.renderDetailsEnum()}
          <AssignmentPanel
            stateAssign={details.stateAssign}
            onClick={stateAssign => {
              onAssignClick(details.id, stateAssign);
            }}
            narrow={!isSmallMode}
            className={classBtn}
          />
          {/*<EcosForm record={details.id} formKey={'alf_ctrwf:reworkTask_mobile'} onSubmit={this.onSubmitForm}/>*/}
        </div>
      </div>
    );
  }
}

export default TaskDetails;
