import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';
import React from 'react';

import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { isSmallMode } from '../../helpers/util';
import UserLocalSettingsService, { DashletProps } from '../../services/userLocalSettings';
import Records from '../Records/Records';

export const EVENTS = {
  RECORD_ACTION_COMPLETED: 'RECORD_ACTION_COMPLETED',
  UPDATE_COMMENTS: 'UPDATE_COMMENTS',
  UPDATE_ASSOCIATIONS: 'UPDATE_ASSOCIATIONS',
  UPDATE_TASKS_WIDGETS: 'UPDATE_TASKS_WIDGETS',
  ASSOC_UPDATE: 'ASSOC_UPDATE',
  ATTS_UPDATED: 'ATTS_UPDATED'
};

interface FitHeights {
  min: number;
  max: number;
}
export interface BaseWidgetProps {
  id: string;
  dashboardId: string;
  record: string;
  tabId: string;
  isSameHeight: boolean;
  stateId?: string;
  config?: {
    collapsed?: boolean;
  };
  maxHeightByContent?: boolean;
  fixedHeight?: boolean;
  onLoad?: (component: BaseWidget) => void;
  onUpdate?: (component: BaseWidget) => void;
  onSave?: (id: string, config: any, callback: () => void) => void;
}

export interface BaseWidgetState {
  lsId?: string;
  runUpdate?: boolean;
  fitHeights?: Partial<FitHeights>;
  contentHeight?: number | null;
  width?: number;
  previousHeight?: number;
  userHeight?: number;
}

abstract class BaseWidget<P extends BaseWidgetProps = BaseWidgetProps, S extends BaseWidgetState = BaseWidgetState> extends React.Component<
  P,
  S
> {
  _dashletRef: HTMLDivElement | null = null;
  _observableFieldsToUpdate: string[] = ['_modified'];
  _updateWatcher: any;
  contentRef = React.createRef<HTMLDivElement>();

  constructor(props: P) {
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
      userHeight: UserLocalSettingsService.getDashletHeight(lsId)
    } as S;
    this._updateWatcher = this.instanceRecord.watch(this._observableFieldsToUpdate, this.reload);
  }

  componentDidMount() {
    const { onLoad } = this.props;

    isFunction(onLoad) && onLoad(this);
    this.updateLocalStorageDate();
  }

  componentDidUpdate(prevProps: P, prevState: S) {
    const { onUpdate } = this.props;

    isFunction(onUpdate) && onUpdate(this);

    if (this.state.runUpdate && !prevState.runUpdate) {
      this.handleUpdate();
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this._updateWatcher);
  }

  get isCollapsed(): boolean {
    const { config } = this.props;
    const lsId = this.state.lsId;
    const isCollapsedByConfig = config?.collapsed;
    const isCollapsedByLS = UserLocalSettingsService.getDashletProperty(lsId, DashletProps.IS_COLLAPSED);

    return isCollapsedByLS === undefined ? (isCollapsedByConfig ?? false) : isCollapsedByLS;
  }

  get widgetType(): string {
    return get(this.constructor, 'name', 'UnknownWidget');
  }

  get isNarrow(): boolean {
    return isSmallMode(this.state.width);
  }

  get instanceRecord() {
    return Records.get(this.props.record);
  }

  get clientHeight(): number {
    if (!this.props.maxHeightByContent) {
      return MAX_DEFAULT_HEIGHT_DASHLET;
    }

    return get(this.contentRef, 'current.offsetHeight', 0);
  }

  get contentHeight(): number {
    return get(this.contentRef, 'current.offsetHeight', 0);
  }

  get otherHeight(): number {
    return this.dashletOtherHeight;
  }

  get fullHeight(): number {
    return (this.clientHeight || 0) + this.otherHeight;
  }

  get dashletHeight(): number {
    return get(this._dashletRef, 'offsetHeight', 0);
  }

  get dashletOtherHeight(): number {
    if (!this._dashletRef) {
      return 0;
    }

    const body = this._dashletRef.querySelector('.dashlet__body') as HTMLElement;
    const header = this._dashletRef.querySelector('.dashlet__header-wrapper') as HTMLElement;
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

  get scrollbarProps(): Record<string, any> {
    const { maxHeightByContent, fixedHeight } = this.props;

    if (maxHeightByContent) {
      return {
        autoHeight: true,
        autoHeightMax: '100%'
      };
    }

    if (fixedHeight) {
      return {
        style: {
          height: MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight
        }
      };
    }

    return {
      autoHeight: true,
      autoHeightMax: MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight || '100%'
    };
  }
  get observableFieldsToUpdate(): string[] {
    return this._observableFieldsToUpdate;
  }

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
  set observableFieldsToUpdateWithDefault(fields: string[]) {
    this.observableFieldsToUpdate = [...new Set([...fields, ...this._observableFieldsToUpdate])];
  }

  setDashletRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      this._dashletRef = ref;
    }
  };

  setContentHeight = (contentHeight: number) => {
    const contentHeightState = this.state.contentHeight;

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

  setFitHeights = (fitHeights: FitHeights) => {
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

  handleChangeHeight = (userHeight?: number) => {
    userHeight = userHeight && userHeight > 0 ? userHeight : 0;

    if (this.state.userHeight === userHeight) {
      return;
    }

    if (this.fullHeight && userHeight > this.fullHeight) {
      userHeight = this.fullHeight;
    }
    // @ts-ignore
    UserLocalSettingsService.setDashletHeight(this.state.lsId, userHeight);

    this.setState({ userHeight });
  };

  handleToggleContent = (isCollapsed = false) => {
    UserLocalSettingsService.setDashletProperty(this.state.lsId, { isCollapsed });
    this.forceUpdate();
  };

  handleResize = (width: number) => {
    !!width && this.setState({ width });
  };

  handleUpdate() {}
}

export default BaseWidget;
