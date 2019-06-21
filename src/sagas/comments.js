import { delay } from 'redux-saga';
import { put, takeLatest, call } from 'redux-saga/effects';
import {
  createComment,
  deleteComment,
  fetchEnd,
  fetchStart,
  getComments,
  sendingEnd,
  sendingStart,
  setComments,
  updateComment
} from '../actions/comments';

function* sagaGetComments({ api, logger }, action) {
  try {
    yield put(fetchStart());

    const { records, ...other } = yield api.comments.getAll(action.payload);

    yield put(
      setComments({
        comments: records,
        ...other
      })
    );

    yield put(fetchEnd());
  } catch (e) {
    logger.error('[comments sagaGetComments saga error', e.message);
  }
}

// TODO: доделать, как разберутся с созданием комментария
function* sagaCreateComment({ api, logger }, action) {
  try {
    yield put(sendingStart());

    // TODO: далить после тестирования функционала
    yield delay(3000);

    const id = yield api.comments.create(action.payload);

    // TODO: Запрос информации о комментарии по полученному id

    console.warn(id);

    yield put(sendingEnd());
  } catch (e) {
    logger.error('[comments sagaCreateComment saga error', e.message);
  }
}

function* sagaUpdateComment({ api, logger }, action) {
  try {
    yield put(sendingStart());

    // TODO: далить после тестирования функционала
    yield delay(3000);

    yield api.comments.update(action.payload);

    yield put(sendingEnd());
  } catch (e) {
    logger.error('[comments sagaUpdateComment saga error', e.message);
  }
}

function* sagaDeleteComment({ api, logger }, action) {
  try {
    yield api.comments.delete(action.payload);
  } catch (e) {
    logger.error('[comments sagaDeleteComment saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getComments().type, sagaGetComments, ea);
  yield takeLatest(createComment().type, sagaCreateComment, ea);
  yield takeLatest(updateComment().type, sagaUpdateComment, ea);
  yield takeLatest(deleteComment().type, sagaDeleteComment, ea);
}

export default saga;
