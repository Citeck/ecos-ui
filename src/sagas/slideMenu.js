import { LOCATION_CHANGE } from 'connected-react-router';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  fetchSlideMenuItems,
  getSiteDashboardEnable,
  performAction,
  setExpandableItems,
  setIsReady,
  setSelectedId,
  setSiteDashboardEnable,
  setSlideMenuItems,
  toggleIsOpen
} from '../actions/slideMenu';
import SidebarService from '../services/sidebar';
import SidebarConverter from '../dto/sidebar';
import { goToCardDetailsPage } from '../helpers/urls';
import { SourcesId } from '../constants';
import { MenuSettings } from '../constants/menu';
import FormManager from '../components/EcosForm/FormManager';
import Records from '../components/Records';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';

function* fetchSlideMenu({ api, logger }, action) {
  try {
    const version = yield select(state => state.menu.version);
    const isOpen = SidebarService.getOpenState();
    const id = get(action, 'payload.id');

    let menuItems;

    if (id || version) {
      menuItems = yield call(api.menu.getMenuItems, { id, version, resolved: true });
    } else {
      const apiData = yield call(api.menu.getSlideMenuItems);
      menuItems = apiData.items;
    }

    menuItems = SidebarConverter.getMenuListWeb(menuItems);

    yield put(toggleIsOpen(isOpen));
    yield put(setSlideMenuItems(menuItems));
    yield put(setIsReady(true));
  } catch (e) {
    logger.error('[fetchSlideMenu saga] error', e);
  }
}

function* fetchSiteDashboardEnable({ api, logger }) {
  try {
    const res = yield call(api.menu.checkSiteDashboardEnable);

    yield put(setSiteDashboardEnable(!!res));
  } catch (e) {
    logger.error('[fetchSiteDashboardEnable saga] error', e);
  }
}

function* sagaToggleMenu({ api, logger }, action) {
  try {
    yield call(SidebarService.setOpenState, action.payload);
  } catch (e) {
    logger.error('[sagaToggleMenu saga] error', e);
  }
}

function* sagaSetSelectedId({ api, logger }) {
  try {
    const { isReady, items } = yield select(state => state.slideMenu);

    if (!isReady) {
      return;
    }

    const selectedId = SidebarService.getSelectedId(items);

    yield put(setSelectedId(selectedId));
    yield put(setExpandableItems({ selectedId }));
  } catch (e) {
    logger.error('[sagaSetSelectedId saga] error', e);
  }
}

function* sagaPerformAction({ api, logger }, { payload }) {
  try {
    let createVariant = {};

    switch (payload.type) {
      case MenuSettings.ItemTypes.LINK_CREATE_CASE:
        createVariant = get(payload, 'config.variant');
        break;
      case MenuSettings.ItemTypes.START_WORKFLOW:
        const processDef = get(payload, 'config.processDef', '');
        const processId = processDef.replace(`${SourcesId.BPMN_DEF}@`, '');
        const processRecordRef = `${SourcesId.BPMN_PROC}@${processId}`;

        createVariant.formTitle = yield call(api.page.getRecordTitle, processDef);
        createVariant.recordRef = processRecordRef;
        createVariant.formRef = yield Records.get(processDef).load('startFormRef?id');

        if (processId.indexOf('activiti$') !== -1) {
          const alfProcDef = `${SourcesId.A_WORKFLOW}@def_${processId}`;
          const hasForm = !!createVariant.formRef || (yield EcosFormUtils.hasForm(alfProcDef));
          if (!hasForm) {
            window.open('/share/page/start-specified-workflow?workflowId=' + processId, '_self');
            return;
          }
        }
        break;
      default:
        break;
    }

    FormManager.createRecordByVariant(createVariant, {
      title: createVariant.formTitle,
      onSubmit: record => {
        switch (createVariant.afterSubmit) {
          case 'reload':
            window.location.reload();
            break;
          case 'none':
            break;
          default:
            goToCardDetailsPage(record.id);
        }
      }
    });
  } catch (e) {
    logger.error('[sagaSetSelectedId saga] error', e);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchSlideMenuItems().type, fetchSlideMenu, ea);
  yield takeLatest(getSiteDashboardEnable().type, fetchSiteDashboardEnable, ea);
  yield takeLatest(toggleIsOpen().type, sagaToggleMenu, ea);
  yield takeLatest(performAction().type, sagaPerformAction, ea);
  yield takeLatest([setIsReady().type, LOCATION_CHANGE], sagaSetSelectedId, ea);
}

export default headerSaga;
