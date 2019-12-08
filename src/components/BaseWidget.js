import React, { Component } from 'react';
import get from 'lodash/get';

import UserLocalSettingsService from '../services/userLocalSettings';

class BaseWidget extends Component {
  contentRef = React.createRef();

  get clientHeight() {
    if (!this.props.maxHeightByContent) {
      return null;
    }

    return get(this.contentRef, 'current.offsetHeight', 0);
  }

  setContentHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  handleChangeHeight = height => {
    const pureHeight = height > 0 ? height : 0;

    if (this.state.userHeight === pureHeight) {
      return;
    }

    UserLocalSettingsService.setDashletHeight(this.props.id, pureHeight >= this.clientHeight ? null : pureHeight);
    this.setState({ userHeight: pureHeight });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  handleResize = width => {
    this.setState({ width });
  };
}

export default BaseWidget;
