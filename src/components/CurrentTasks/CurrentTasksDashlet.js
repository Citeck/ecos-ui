import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode, t } from '../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET_CONTENT, MIN_DEFAULT_HEIGHT_DASHLET_CONTENT } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import CurrentTasks from './CurrentTasks';

import './style.scss';

class CurrentTasksDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameTasks: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    classNameTasks: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  className = 'ecos-current-task-list-dashlet';

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false,
      isUpdating: false,
      height: UserLocalSettingsService.getDashletHeight(props.id)
    };
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ height });
  };

  onReload = () => {
    this.setState({ isUpdating: true }, () => this.setState({ isUpdating: false }));
  };

  render() {
    const { id, title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isUpdating, height } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t('current-tasks-widget.title')}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        onReload={this.onReload}
        needGoTo={false}
        actionEdit={false}
        canDragging={canDragging}
        actionHelp={false}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.onChangeHeight}
      >
        <ReactResizeDetector handleWidth onResize={this.onResize} />
        {!isUpdating && (
          <CurrentTasks
            {...config}
            className={classNameTasks}
            record={record}
            isSmallMode={isSmallMode}
            stateId={id}
            height={height}
            minHeight={MIN_DEFAULT_HEIGHT_DASHLET_CONTENT}
            maxHeight={MAX_DEFAULT_HEIGHT_DASHLET_CONTENT}
          />
        )}
      </Dashlet>
    );
  }
}

export default CurrentTasksDashlet;
