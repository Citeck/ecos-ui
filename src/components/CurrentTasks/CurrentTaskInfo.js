import * as React from 'react';
import PropTypes from 'prop-types';
import Separator from '../common/Separator/Separator';
import { getOutputFormat } from '../../helpers/util';
import { CurrentTaskPropTypes, DisplayedColumns } from './utils';

class CurrentTaskInfo extends React.Component {
  static propTypes = {
    task: PropTypes.shape(CurrentTaskPropTypes).isRequired
  };

  static defaultProps = {};

  className = 'ecos-current-task-info';

  render() {
    const { task } = this.props;
    const Cols = DisplayedColumns;
    const label = key => {
      return <div className={`${this.className}-label`}>{Cols[key].label}</div>;
    };

    return (
      <div className={this.className}>
        <div className={`${this.className}__title`}>{task[Cols.title.key]}</div>
        <div className={`${this.className}__fields`}>
          {label('actors')}
          <div className={`${this.className}-value`}>
            {task[Cols.actors.key]}
            {task.isGroup && <i className={`ecos-current-task-icon icon-usergroup`} />}
          </div>
          <Separator noIndents className={`${this.className}__separator`} />
          {label('deadline')}
          <div className={`${this.className}-value`}>{getOutputFormat(Cols.deadline.format, task[Cols.deadline.key])}</div>
        </div>
      </div>
    );
  }
}

export default CurrentTaskInfo;
