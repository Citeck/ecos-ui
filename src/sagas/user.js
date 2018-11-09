import { put, takeLatest, call } from 'redux-saga/effects';
import { validateUserRequest, validateUserSuccess, validateUserFailure } from '../actions/user';

// TODO use real api
const fakeApi = {
  validate: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          payload: {
            fullName: 'Administrator',
            nodeRef: 'workspace://SpacesStore/a6ce05f5-bd4b-4196-a12f-a5601a2fa0cd'
          }
        });
      }, 0);
    });
  }
};

export function* validateUser({ api }) {
  try {
    // const resp = yield call(api.auth.validate);
    const resp = yield call(fakeApi.validate); // TODO delete
    if (!resp.success) {
      return yield put(validateUserFailure());
    }

    yield put(validateUserSuccess(resp.payload));
  } catch (e) {
    // TODO use logplease
    // console.log('[validateUser saga] ' + e.message);
    yield put(validateUserFailure());
  }
}

function* userSaga(ea) {
  yield takeLatest(validateUserRequest().type, validateUser, ea);
}

export default userSaga;
