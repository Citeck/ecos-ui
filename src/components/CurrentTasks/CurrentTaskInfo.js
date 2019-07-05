import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { uniqueId } from 'lodash';
import { getOutputFormat } from '../../helpers/util';
import Separator from '../common/Separator/Separator';
import { cleanTaskId, CurrentTaskPropTypes, DisplayedColumns as DC, noData } from './utils';
import IconInfo from './IconInfo';

class CurrentTaskInfo extends React.Component {
  static propTypes = {
    task: PropTypes.shape(CurrentTaskPropTypes).isRequired,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isMobile: false
  };

  className = 'ecos-current-task-info';

  state = {
    isOpen: false
  };

  render() {
    const { task, isMobile } = this.props;
    const { isOpen } = this.state;
    const label = key => {
      return <div className={`${this.className}-label`}>{DC[key].label}</div>;
    };
    const classValue = `${this.className}-value`;

    return (
      <div className={this.className}>
        <div className={`${this.className}__title`}>{task[DC.title.key]}</div>
        <div className={`${this.className}__fields`}>
          {label('actors')}
          <div className={classNames(classValue, { [`${classValue}_with-icon`]: isMobile })}>
            {task[DC.actors.key] || noData}
            <IconInfo
              iconClass={'icon-usergroup'}
              id={uniqueId(cleanTaskId(task.id))}
              text={task.actorsGroup}
              isShow={task.isGroup}
              noTooltip={isMobile}
              handleClick={res => this.setState({ isOpen: res })}
            />
          </div>
          {isMobile && isOpen && <div className={`${classValue}_add`}>{task.actorsGroup}</div>}
          <Separator noIndents className={`${this.className}__separator`} />
          {label('deadline')}
          <div className={`${this.className}-value`}>{getOutputFormat(DC.deadline.format, task[DC.deadline.key]) || noData}</div>
        </div>
      </div>
    );
  }
}

export default CurrentTaskInfo;
