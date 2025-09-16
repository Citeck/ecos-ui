import React from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import isFunction from 'lodash/isFunction';

import { isSmallMode } from '../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import UserLocalSettingsService, { DashletProps } from '../../services/userLocalSettings';
import Records from '../Records/Records';

export const EVENTS = {
  RECORD_ACTION_COMPLETED: 'RECORD_ACTION_COMPLETED',
  UPDATE_COMMENTS: 'UPDATE_COMMENTS',
  UPDATE_ASSOCIATIONS: 'UPDATE_ASSOCIATIONS',
  UPDATE_TASKS_WIDGETS: 'UPDATE_TASKS_WIDGETS',
  ASSOC_UPDATE: 'ASSOC_UPDATE',
};

class BaseWidget extends React.Component {
  _dashletRef = null;
  _observableFieldsToUpdate = ['_modified'];

  contentRef = React.createRef();

  constructor(props) {
    super(props);

    const lsId = `${props.dashboardId}/${props.id}`;

    UserLocalSettingsService.checkOldData(props.id, props.tabId);

    this.state = {
      lsId,
      runUpdate: false,
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      previousHeight: 0,
      userHeight: UserLocalSettingsService.getDashletHeight(lsId),
    };
    this._updateWatcher = this.instanceRecord.watch(this._observableFieldsToUpdate, this.reload);
  }

  componentDidMount() {
    const { onLoad } = this.props;

    isFunction(onLoad) && onLoad(this);
    this.updateLocalStorageDate();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { onUpdate } = this.props;

    isFunction(onUpdate) && onUpdate(this);

    if (this.state.runUpdate && !prevState.runUpdate) {
      this.handleUpdate();
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this._updateWatcher);
  }

  get isCollapsed() {
    const { config } = this.props;
    const lsId = this.state.lsId;
    const isCollapsedByConfig = get(config, 'collapsed');
    const isCollapsedByLS = UserLocalSettingsService.getDashletProperty(lsId, DashletProps.IS_COLLAPSED);

    return isUndefined(isCollapsedByLS) ? isCollapsedByConfig : isCollapsedByLS;
  }

  get isNarrow() {
    return isSmallMode(this.state.width);
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
    return this._observableFieldsToUpdate;
  }

  get dashletHeight() {
    return get(this._dashletRef, 'offsetHeight', 0);
  }

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

  /**
   * props for Scrollbar component
   *
   * @returns {Object}
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

  /** @param {Array<String>} fields */
  set observableFieldsToUpdate(fields) {
    this._observableFieldsToUpdate = fields;

    if (this._updateWatcher) {
      this.instanceRecord.unwatch(this._updateWatcher);
      this._updateWatcher = null;
    }

    if (!isEmpty(fields)) {
      this._updateWatcher = this.instanceRecord.watch(this._observableFieldsToUpdate, this.reload.bind(this));
    }
  }

  /** @param {Array<String>} fields */
  set observableFieldsToUpdateWithDefault(fields) {
    this.observableFieldsToUpdate = [...new Set([...fields, ...this._observableFieldsToUpdate])];
  }

  /**
   * for Dashlet component; props - setRef
   *
   * @param ref
   */
  setDashletRef = (ref) => {
    if (ref) {
      this._dashletRef = ref;
    }
  };

  setContentHeight = (contentHeight) => {
    let contentHeightState = this.state.contentHeight;

    if (contentHeight < 0) {
      contentHeight = 0;
    }

    if (!contentHeight && isUndefined(this.state.userHeight)) {
      return;
    }

    if (contentHeightState !== contentHeight) {
      this.setState({ contentHeight });
    }
  };

  setFitHeights = (fitHeights) => {
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
        previousHeight: this.dashletHeight - this.otherHeight,
      },
      () => this.setState({ runUpdate: false }),
    );
  }, 0);

  handleChangeHeight = (userHeight) => {
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
    UserLocalSettingsService.setDashletProperty(this.state.lsId, { isCollapsed });
    this.forceUpdate();
  };

  handleResize = (width) => {
    !!width && this.setState({ width });
  };

  handleUpdate() {}
}

export default BaseWidget;
