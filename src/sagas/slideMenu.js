import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { setTabs } from '../actions/pageTabs';
import {
  fetchSlideMenuItems,
  getSiteDashboardEnable,
  performAction,
  setExpandableItems,
  setInitialSelectedId,
  setIsReady,
  setSelectedId,
  setSiteDashboardEnable,
  setSlideMenuItems,
  toggleIsOpen
} from '../actions/slideMenu';
import { FORM_MODE_CREATE } from '../components/EcosForm';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import FormManager from '../components/EcosForm/FormManager';
import Records from '../components/Records';
import { SourcesId } from '../constants';
import { MenuSettings } from '../constants/menu';
import SidebarConverter from '../dto/sidebar';
import { goToCardDetailsPage } from '../helpers/urls';
import SidebarService from '../services/sidebar';

function* fetchSlideMenu({ api }, action) {
  try {
    const version = yield select(state => state.menu.version);
    const items = yield select(state => state.slideMenu.items);
    const isOpen = SidebarService.getOpenState();
    const id = get(action, 'payload.id');
    const forceFetch = get(action, 'payload.forceFetch', false);

    if (forceFetch || (!forceFetch && (!items || isEmpty(items)))) {
      let menuItems;

      if (!isNil(id) || !isNil(version)) {
        menuItems = yield call(api.menu.getMenuItems, { id, version, resolved: true });
      } else {
        const apiData = yield call(api.menu.getSlideMenuItems);
        menuItems = apiData.items;
      }

      menuItems = SidebarConverter.getMenuListWeb(menuItems);

      yield put(setSlideMenuItems(menuItems));
    }

    yield put(toggleIsOpen(isOpen));
    yield put(setIsReady(true));

    yield put(setExpandableItems({ force: isOpen }));
  } catch (e) {
    console.error('[fetchSlideMenu saga] error', e);
  }
}

function* fetchSiteDashboardEnable({ api }) {
  try {
    const res = yield call(api.menu.checkSiteDashboardEnable);

    yield put(setSiteDashboardEnable(!!res));
  } catch (e) {
    console.error('[fetchSiteDashboardEnable saga] error', e);
  }
}

function* sagaToggleMenu({ api }, action) {
  try {
    yield call(SidebarService.setOpenState, action.payload);
  } catch (e) {
    console.error('[sagaToggleMenu saga] error', e);
  }
}

function* sagaSetSelectedId({ api }) {
  try {
    const { isReady, items } = yield select(state => state.slideMenu);

    if (!isReady) {
      return;
    }

    const selectedId = SidebarService.getSelectedId(items);

    yield put(setSelectedId(selectedId));
    yield put(setExpandableItems({ selectedId }));
  } catch (e) {
    console.error('[sagaSetSelectedId saga] error', e);
  }
}

function* sagaPerformAction({ api }, { payload }) {
  try {
    let createVariant = {};

    switch (payload.type) {
      case MenuSettings.ItemTypes.LINK_CREATE_CASE:
        createVariant = get(payload, 'config.variant');
        break;
      case MenuSettings.ItemTypes.START_WORKFLOW:
        const processDef = get(payload, 'config.processDef', '');
        const processId = processDef.replace(`${SourcesId.BPMN_DEF}@`, '').replace(`${SourcesId.BPMN_PROC_LATEST}@`, '');
        const processRecordRef = `${SourcesId.BPMN_PROC}@${processId}`;

        createVariant.formTitle = yield call(api.page.getRecordTitle, processDef);
        createVariant.recordRef = processRecordRef;
        createVariant.formRef = yield Records.get(processDef).load('startFormRef?id');
        createVariant.formMode = FORM_MODE_CREATE;

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
      onSubmit: (record, postCreateActionExecuted) => {
        switch (createVariant.afterSubmit) {
          case 'reload':
            window.location.reload();
            break;
          case 'open-card':
            goToCardDetailsPage(record.id);
            break;
          case 'none':
            break;
          default:
            if (!postCreateActionExecuted || createVariant.postActionRef === 'uiserv/action@none') {
              goToCardDetailsPage(record.id);
            }
        }
      }
    });
  } catch (e) {
    console.error('[sagaSetSelectedId saga] error', e);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchSlideMenuItems().type, fetchSlideMenu, ea);
  yield takeLatest(getSiteDashboardEnable().type, fetchSiteDashboardEnable, ea);
  yield takeLatest(toggleIsOpen().type, sagaToggleMenu, ea);
  yield takeLatest(performAction().type, sagaPerformAction, ea);
  yield takeLatest([setIsReady().type, setInitialSelectedId, setTabs], sagaSetSelectedId, ea);
}

export default headerSaga;
