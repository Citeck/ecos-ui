import * as React from 'react';
import PropTypes from 'prop-types';
import { Caption } from '../../common/form';
import { TasksPropTypes, displayedColumns } from '../utils';
import '../style.scss';

class TaskDetails extends React.Component {
  static propTypes = {
    details: PropTypes.shape(TasksPropTypes).isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    details: {},
    className: ''
  };

  className = 'ecos-task-details';

  renderDetails() {
    const { details } = this.props;
    const columns = displayedColumns().sort((c, n) => c.order - n.order);
    const className = `${this.className}__detail`;

    return (
      <div className={`${this.className}__details`}>
        {columns.map(item => (
          <div className={className}>
            <div className={`${className}-label`}>{item.label}</div>
            <div className={`${className}-value`}>{details[item.key]}</div>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { details } = this.props;

    return (
      <div className={this.className}>
        <Caption className={`${this.className}__title`} middle>
          <span>{details.title}</span>
        </Caption>
        {this.renderDetails()}
      </div>
    );
  }
}

export default TaskDetails;
