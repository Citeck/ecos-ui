import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isNull from 'lodash/isNull';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';

import { clearCache } from '../../components/ReactRouterCache';
import { arrayCompare, deepClone, t } from '../../helpers/util';
import { decodeLink, getSearchParams, getSortedUrlParams, SearchKeys } from '../../helpers/urls';
import { removeItems } from '../../helpers/ls';
import { RequestStatuses, URL } from '../../constants';
import { DashboardTypes, DeviceTabs } from '../../constants/dashboard';
import { Layouts, LayoutTypes } from '../../constants/layout';
import DashboardService from '../../services/dashboard';
import PageService from '../../services/PageService';
import UserLocalSettingsService from '../../services/userLocalSettings';
import pageTabList from '../../services/pageTabs/PageTabList';
import { selectStateByKey } from '../../selectors/dashboardSettings';
import {
  getAwayFromPage,
  getCheckUpdatedDashboardConfig,
  initDashboardSettings,
  resetConfigToDefault,
  resetDashboardConfig,
  saveDashboardConfig,
  setCheckUpdatedDashboardConfig
} from '../../actions/dashboardSettings';
import { DndUtils } from '../../components/Drag-n-Drop';
import { Loader, Tabs } from '../../components/common';
import { Btn } from '../../components/common/btns';
import { TunableDialog } from '../../components/common/dialogs';

import SetBind from './SetBind';
import SetTabs from './SetTabs';
import SetLayouts from './SetLayouts';
import SetWidgets from './SetWidgets';

import './style.scss';
import DashboardSettingsConverter from '../../dto/dashboardSettings';
import Settings from './Settings';

const getStateId = props => get(getSearchParams(), SearchKeys.DASHBOARD_ID, props.tabId || 'base');

export const mapStateToProps = (state, ownProps) => ({
  isActive: ownProps.tabId ? pageTabList.isActiveTab(ownProps.tabId) : true,
  userData: {
    userName: get(state, 'user.userName'),
    isAdmin: get(state, 'user.isAdmin', false)
  },
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  ...selectStateByKey(state, getStateId(ownProps))
});

export const mapDispatchToProps = (dispatch, ownProps) => {
  const key = getStateId(ownProps);

  return {
    initSettings: payload => dispatch(initDashboardSettings({ ...payload, key })),
    checkUpdatedSettings: payload => dispatch(getCheckUpdatedDashboardConfig({ ...payload, key })),
    saveSettings: payload => dispatch(saveDashboardConfig({ ...payload, key })),
    getAwayFromPage: () => dispatch(getAwayFromPage(key)),
    setCheckUpdatedConfig: payload => dispatch(setCheckUpdatedDashboardConfig({ ...payload, key })),
    resetConfig: () => dispatch(resetDashboardConfig(key)),
    resetConfigToDefault: payload => dispatch(resetConfigToDefault({ ...payload, key }))
  };
};

const DESK_VER = find(DeviceTabs, ['key', 'desktop']);

const findLayout = type => Layouts.find(layout => layout.type === type) || {};

class DashboardSettings extends Settings {}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    areStatePropsEqual: next => !next.isActive
  }
)(DashboardSettings);
