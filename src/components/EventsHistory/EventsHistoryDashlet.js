import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isSmallMode, t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import { EventsHistory } from './';

import './style.scss';

class EventsHistoryDashlet extends React.Component {
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
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  className = 'ecos-action-history-dashlet';

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false,
      height: UserLocalSettingsService.getDashletHeight(props.id),
      fitHeights: {}
    };
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ height });
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  render() {
    const { id, title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isUpdating, height, fitHeights } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t('История событий')}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        actionEdit={false}
        actionReload={false}
        actionHelp={false}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.onChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
      >
        {!isUpdating && (
          <EventsHistory
            {...config}
            className={classNameContent}
            record={record}
            isSmallMode={isSmallMode}
            stateId={id}
            height={height}
            minHeight={fitHeights.min}
            maxHeight={fitHeights.max}
          />
        )}
      </Dashlet>
    );
  }
}

export default EventsHistoryDashlet;
