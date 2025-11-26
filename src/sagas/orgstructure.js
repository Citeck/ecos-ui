import get from 'lodash/get';
import { put, takeLatest } from 'redux-saga/effects';

import { setDashboardConfig, setDashboardIdentification } from '../actions/dashboard';
import { getDashboardConfig } from '../actions/orgstructure';
import { t } from '../helpers/export/util';
import { ORGSTRUCTURE_CONFIG } from '../pages/Orgstructure/config';

import { NotificationManager } from '@/services/notifications';

function* sagaGetDashboardConfig({ api }, { payload }) {
  try {
    const result = ORGSTRUCTURE_CONFIG;

    yield put(
      setDashboardIdentification({
        identification: {
          id: 'orgstructure',
          key: 'emodel/type@orgstructure-person-dashboard',
          type: 'orgstructure-person-dashboard'
        },
        key: payload.key
      })
    );

    yield put(
      setDashboardConfig({
        config: get(result, 'config.layouts', []),
        originalConfig: result.config,
        key: payload.key,
        identification: {
          id: 'orgstructure',
          key: 'emodel/type@orgstructure-person-dashboard',
          type: 'orgstructure-person-dashboard'
        }
      })
    );
  } catch (e) {
    NotificationManager.error(t('dashboard.error.get-config'), t('error'));
    console.error('[orgstructure/sagaGetDashboardConfig saga] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, sagaGetDashboardConfig, ea);
}

export default saga;
