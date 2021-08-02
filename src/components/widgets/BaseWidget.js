import React, { Component } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';

import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import UserLocalSettingsService, { DashletProps } from '../../services/userLocalSettings';
import Records from '../Records/Records';

class BaseWidget extends Component {
  #dashletRef = null;
  #observableFieldsToUpdate = ['_modified'];
  #updateWatcher = null;

  contentRef = React.createRef();

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
      previousHeight: 0,
      userHeight: UserLocalSettingsService.getDashletHeight(lsId),
      isCollapsed: UserLocalSettingsService.getDashletProperty(lsId, DashletProps.IS_COLLAPSED)
    };
    this.#updateWatcher = this.instanceRecord.watch(this.#observableFieldsToUpdate, this.reload);
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
    this.instanceRecord.unwatch(this.#updateWatcher);
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

  get contentHeight() {
    return get(this.contentRef, 'current.offsetHeight', 0);
  }

  get otherHeight() {
    return this.dashletOtherHeight;
  }

  get fullHeight() {
    return this.clientHeight + this.otherHeight;
  }

  get observableFieldsToUpdate() {
    return this.#observableFieldsToUpdate;
  }

  get dashletHeight() {
    return get(this.#dashletRef, 'offsetHeight', 0);
  }

  get dashletOtherHeight() {
    if (!this.#dashletRef) {
      return 0;
    }

    const body = this.#dashletRef.querySelector('.dashlet__body');
    const header = this.#dashletRef.querySelector('.dashlet__header-wrapper');
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

  /**
   * props for Scrollbar component
   *
   * @returns {{}}
   */
  get scrollbarProps() {
    const { maxHeightByContent, fixedHeight } = this.props;
    const props = {};

    if (maxHeightByContent) {
      props.autoHeight = true;
      props.autoHeightMax = '100%';

      return props;
    }

    if (fixedHeight) {
      props.style = { height: MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight };

      return props;
    }

    props.autoHeight = true;
    props.autoHeightMax = MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight || '100%';

    return props;
  }

  set observableFieldsToUpdate(fields) {
    this.#observableFieldsToUpdate = fields;

    if (this.#updateWatcher) {
      this.instanceRecord.unwatch(this.#updateWatcher);
    }

    if (!isEmpty(fields)) {
      this.#updateWatcher = this.instanceRecord.watch(this.#observableFieldsToUpdate, this.reload);
    }
  }

  /**
   * for Dashlet component; props - setRef
   *
   * @param ref
   */
  setDashletRef = ref => {
    if (ref) {
      this.#dashletRef = ref;
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

  setPreviousHeight() {
    this.setState({ previousHeight: this.dashletHeight - this.otherHeight });
  }

  updateLocalStorageDate = () => {
    UserLocalSettingsService.updateDashletDate(this.state.lsId);
  };

  checkHeight = debounce((force = false) => {
    if (this.state.userHeight === undefined || this.state.userHeight > this.fullHeight || force) {
      this.setState({ userHeight: this.fullHeight });
    }
  }, 400);

  reload = debounce(() => {
    this.setState(
      {
        runUpdate: true,
        previousHeight: this.dashletHeight - this.otherHeight
      },
      () => this.setState({ runUpdate: false })
    );
  }, 0);

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
}

export default BaseWidget;
