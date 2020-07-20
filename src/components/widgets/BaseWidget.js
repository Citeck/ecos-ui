import React, { Component } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';

import UserLocalSettingsService, { DashletProps } from '../../services/userLocalSettings';
import Records from '../Records/Records';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';

class BaseWidget extends Component {
  contentRef = React.createRef();

  updateWatcher = null;

  _observableFieldsToUpdate = ['cm:modified', '_modified'];

  constructor(props) {
    super(props);

    const lsId = `${props.id}/${props.tabId}`;

    UserLocalSettingsService.checkOldData(props.id, props.tabId);

    this.state = {
      lsId,
      runUpdate: false,
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(lsId),
      isCollapsed: UserLocalSettingsService.getDashletProperty(lsId, DashletProps.IS_COLLAPSED)
    };
    this.updateWatcher = this.instanceRecord.watch(this._observableFieldsToUpdate, this.reload.bind(this));
  }

  componentDidMount() {
    const { onLoad } = this.props;

    if (typeof onLoad === 'function') {
      onLoad(this);
    }

    this.updateLocalStorageDate();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { onUpdate } = this.props;

    if (typeof onUpdate === 'function') {
      onUpdate(this);
    }

    if (this.state.runUpdate && !prevState.runUpdate) {
      this.handleUpdate();
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.updateWatcher);
  }

  get instanceRecord() {
    return Records.get(this.props.record);
  }

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

  get observableFieldsToUpdate() {
    return this._observableFieldsToUpdate;
  }

  setContentHeight = contentHeight => {
    let contentHeightState = this.state.contentHeight;

    if (contentHeight < 0) {
      contentHeight = 0;
    }

    if (!contentHeight && this.state.userHeight === undefined) {
      return;
    }

    if (contentHeightState !== contentHeight) {
      this.setState({ contentHeight });
    }
  };

  setFitHeights = fitHeights => {
    const fitHeightsState = this.state.fitHeights;

    if (JSON.stringify(fitHeightsState) !== JSON.stringify(fitHeights)) {
      this.setState({ fitHeights });
    }
  };

  set observableFieldsToUpdate(fields) {
    this._observableFieldsToUpdate = fields;

    if (this.updateWatcher) {
      this.instanceRecord.unwatch(this.updateWatcher);
    }

    if (!isEmpty(fields)) {
      this.updateWatcher = this.instanceRecord.watch(this._observableFieldsToUpdate, this.reload.bind(this));
    }
  }

  updateLocalStorageDate = () => {
    UserLocalSettingsService.updateDashletDate(this.state.lsId);
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

    UserLocalSettingsService.setDashletHeight(this.state.lsId, userHeight);

    this.setState({ userHeight });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setDashletProperty(this.state.lsId, { isCollapsed });
  };

  handleResize = width => {
    !!width && this.setState({ width });
  };

  handleUpdate() {}

  reload() {
    this.setState({ runUpdate: true }, () => this.setState({ runUpdate: false }));
  }
}

export default BaseWidget;
