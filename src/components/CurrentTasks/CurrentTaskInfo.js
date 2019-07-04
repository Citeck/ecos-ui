import * as React from 'react';
import PropTypes from 'prop-types';
import Separator from '../common/Separator/Separator';
import { getOutputFormat } from '../../helpers/util';
import { CurrentTaskPropTypes, DisplayedColumns as DC, iconGroup, noData } from './utils';

class CurrentTaskInfo extends React.Component {
  static propTypes = {
    task: PropTypes.shape(CurrentTaskPropTypes).isRequired
  };

  static defaultProps = {};

  className = 'ecos-current-task-info';

  render() {
    const { task } = this.props;
    const label = key => {
      return <div className={`${this.className}-label`}>{DC[key].label}</div>;
    };

    return (
      <div className={this.className}>
        <div className={`${this.className}__title`}>{task[DC.title.key]}</div>
        <div className={`${this.className}__fields`}>
          {label('actors')}
          <div className={`${this.className}-value`}>
            {task[DC.actors.key] || noData}
            {iconGroup(task.isGroup)}
          </div>
          <Separator noIndents className={`${this.className}__separator`} />
          {label('deadline')}
          <div className={`${this.className}-value`}>{getOutputFormat(DC.deadline.format, task[DC.deadline.key]) || noData}</div>
        </div>
      </div>
    );
  }
}

export default CurrentTaskInfo;
