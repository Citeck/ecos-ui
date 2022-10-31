import get from 'lodash/get';
import { put, takeLatest } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { getDashboardConfig } from '../actions/orgstructure';
import { t } from '../helpers/export/util';
import { ORGSTRUCTURE_CONFIG } from '../pages/Orgstructure/config';
import { setDashboardConfig, setDashboardIdentification } from '../actions/dashboard';

function* sagaGetDashboardConfig({ api, logger }, { payload }) {
  try {
    // todo: здесь должен быть запрос конфига
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
        key: payload.key
      })
    );
  } catch (e) {
    NotificationManager.error(t('dashboard.error.get-config'), t('error'));
    logger.error('[orgstructure/sagaGetDashboardConfig saga] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, sagaGetDashboardConfig, ea);
}

export default saga;
