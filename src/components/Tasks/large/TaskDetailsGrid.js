import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Grid } from '../../common/grid';
import * as ArrayOfObjects from '../../../helpers/arrayOfObjects';
import { displayedColumns, TasksPropTypes } from '../utils';

class TaskDetailsGrid extends React.Component {
  static propTypes = {
    details: PropTypes.shape(TasksPropTypes).isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    details: {},
    className: ''
  };

  render() {
    const { details, className } = this.props;
    const arr = [details];
    const updCols = ArrayOfObjects.replaceKeys({ key: 'dataField', label: 'text' }, displayedColumns);
    const gridCols = ArrayOfObjects.filterKeys(['dataField', 'text'], updCols);
    const classGrid = classNames('ecos-task__grid-table', className);

    return <Grid data={arr} columns={gridCols} className={classGrid} scrollable={false} />;
  }
}

export default TaskDetailsGrid;
