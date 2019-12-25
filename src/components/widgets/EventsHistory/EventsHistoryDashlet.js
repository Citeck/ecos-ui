import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isSmallMode, t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import Dashlet from '../../Dashlet/Dashlet';
import EventsHistory from './EventsHistory';
import BaseWidget from '../BaseWidget';
import './style.scss';

class EventsHistoryDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: true
  };

  className = 'ecos-event-history-dashlet';

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isSmallMode: false,
      fitHeights: {},
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) }, this.checkHeight);
  };

  render() {
    const { id, title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isUpdating, userHeight, fitHeights, isCollapsed } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t('events-history-widget.title')}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        noActions
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        {!isUpdating && (
          <EventsHistory
            {...config}
            forwardedRef={this.contentRef}
            className={classNameContent}
            record={record}
            isSmallMode={isSmallMode}
            stateId={id}
            height={userHeight}
            minHeight={fitHeights.min}
            maxHeight={fitHeights.max}
          />
        )}
      </Dashlet>
    );
  }
}

export default EventsHistoryDashlet;
