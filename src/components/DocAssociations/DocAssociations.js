import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Dashlet from '../Dashlet/Dashlet';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { DefineHeight } from '../common';

import './style.scss';

const LABELS = {
  TITLE: 'Связи документа'
};

class DocAssociations extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    canDragging: PropTypes.bool,
    dragHandleProps: PropTypes.object
  };

  static defaultProps = {
    canDragging: false,
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      fitHeights: {},
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  handleResize = width => {
    this.setState({ width });
  };

  handleChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ userHeight: height });
  };

  handleSetFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  render() {
    const { canDragging, dragHandleProps, isCollapsed } = this.props;
    const { userHeight = 0, fitHeights } = this.state;
    const fixHeight = userHeight || null;

    return (
      <Dashlet
        title={LABELS.TITLE}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        resizable
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.handleSetFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <DefineHeight fixHeight={fixHeight} maxHeight={fitHeights.max} minHeight={1} getOptimalHeight={this.setContentHeight}>
          DocAssociations
        </DefineHeight>
      </Dashlet>
    );
  }
}

export default DocAssociations;
