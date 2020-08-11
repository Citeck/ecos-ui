import React, { Component } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';

import UserLocalSettingsService, { DashletProps } from '../../services/userLocalSettings';
import Records from '../Records/Records';
import { MIN_WIDTH_DASHLET_SMALL, MAX_DEFAULT_HEIGHT_DASHLET } from '../../constants';

class BaseWidget extends Component {
  _dashletRef = null;

  contentRef = React.createRef();

  updateWatcher = null;

  _observableFieldsToUpdate = ['_modified'];

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

  // TODO: refactor, rename
  get contentHeight() {
    return get(this.contentRef, 'current.offsetHeight', 0);
  }

  get otherHeight() {
    return null;
  }

  get fullHeight() {
    return this.clientHeight + this.otherHeight;
  }

  // get contentHeight() {
  //   const { maxHeightByContent, fixedHeight } = this.props;
  //   const { fitHeights } = this.state;
  //
  //   if (fixedHeight) {
  //     return MAX_DEFAULT_HEIGHT_DASHLET - fitHeights.headerHeight;
  //   }
  //
  //   if (maxHeightByContent) {
  //     return this.clientHeight; // - fitHeights.headerHeight;
  //   }
  //
  //   return undefined;
  // }

  get observableFieldsToUpdate() {
    return this._observableFieldsToUpdate;
  }

  // TODO: refactor, rename
  get dashletOtherHeight() {
    if (!this._dashletRef) {
      return 0;
    }

    const body = this._dashletRef.querySelector('.dashlet__body');
    const header = this._dashletRef.querySelector('.dashlet__header-wrapper');
    const styles = window.getComputedStyle(body, null);
    let paddingBottom = parseInt(styles.getPropertyValue('padding-bottom'), 10) || 0;
    let paddingTop = parseInt(styles.getPropertyValue('padding-top'), 10) || 0;

    if (isNaN(paddingBottom)) {
      paddingBottom = 0;
    }

    if (isNaN(paddingTop)) {
      paddingTop = 0;
    }

    return paddingBottom + paddingTop + get(header, 'offsetHeight', 0);
  }

  setDashletRef = ref => {
    if (ref) {
      this._dashletRef = ref;
    }
  };

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
    const { fixedHeight } = this.props;
    const fitHeightsState = this.state.fitHeights;

    if (JSON.stringify(fitHeightsState) !== JSON.stringify(fitHeights)) {
      if (fixedHeight) {
        fitHeights.min = fitHeights.max;
      }

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

    // TODO: какие-то доп.действия (при необходимости)
    //  JournalDashlet сейчас (при разворачивании) контент не подстраивает по высоте
    // if (this.state.isCollapsed && !isCollapsed) {
    //   this.reload();
    // }
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
