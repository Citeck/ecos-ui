import React, { Component } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import UserLocalSettingsService from '../../services/userLocalSettings';

class BaseWidget extends Component {
  contentRef = React.createRef();

  get clientHeight() {
    if (!this.props.maxHeightByContent) {
      return null;
    }

    return get(this.contentRef, 'current.offsetHeight', 0);
  }

  get otherHeight() {
    return null;
  }

  get fullHeight() {
    return this.clientHeight + this.otherHeight;
  }

  setContentHeight = contentHeight => {
    const contentHeightState = this.state.contentHeight;

    if (contentHeightState !== contentHeight) {
      this.setState({ contentHeight });
    }
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  checkHeight = debounce((force = false) => {
    if (this.state.userHeight === undefined || this.state.userHeight > this.fullHeight || force) {
      this.setState({ userHeight: this.fullHeight });
    }
  }, 400);

  handleChangeHeight = userHeight => {
    userHeight = userHeight > 0 ? userHeight : 0;

    if (this.state.userHeight === userHeight) {
      return;
    }

    if (this.fullHeight && userHeight > this.fullHeight) {
      userHeight = this.fullHeight;
    }

    UserLocalSettingsService.setDashletHeight(this.props.id, userHeight);
    this.setState({ userHeight });
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
