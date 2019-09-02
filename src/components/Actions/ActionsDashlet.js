import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isSmallMode, t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';

import './style.scss';
import Actions from './Actions';

class ActionsDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.object,
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isSmallMode: false,
      fitHeights: {},
      height: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
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

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  render() {
    const { id, title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, height, fitHeights, isCollapsed } = this.state;

    return (
      <Dashlet
        title={title || t('Действия')}
        bodyClassName="ecos-actions-dashlet__body"
        className={classNames('ecos-actions-dashlet', classNameDashlet)}
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
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Actions
          {...config}
          className={classNameContent}
          record={record}
          isSmallMode={isSmallMode}
          stateId={id}
          height={height}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
        />
      </Dashlet>
    );
  }
}

export default ActionsDashlet;
