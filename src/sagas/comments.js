import { delay } from 'redux-saga';
import { put, takeLatest, call, select } from 'redux-saga/effects';
import {
  createCommentRequest,
  createCommentSuccess,
  deleteCommentRequest,
  deleteCommentSuccess,
  fetchEnd,
  fetchStart,
  getComments,
  sendingEnd,
  sendingStart,
  setComments,
  updateCommentRequest,
  updateCommentSuccess
} from '../actions/comments';
import { setNotificationMessage } from '../actions/notification';
import { selectAllComments } from '../selectors/comments';
import { getCommentForWeb } from '../dto/comments';
import { t } from '../helpers/util';

function* sagaGetComments({ api, logger }, action) {
  try {
    yield put(fetchStart());

    const { records, ...extraProps } = yield api.comments.getAll(action.payload);

    yield put(
      setComments({
        comments: records.map(record => getCommentForWeb(record)),
        ...extraProps
      })
    );

    yield put(fetchEnd());
  } catch (e) {
    logger.error('[comments sagaGetComments saga error', e.message);
  }
}

function* sagaCreateComment({ api, logger }, action) {
  try {
    yield put(sendingStart());

    const record = yield api.comments.create(action.payload);
    const comment = yield api.comments.getCommentById(record.id);
    const comments = yield select(selectAllComments);

    comment.id = record.id;
    comments.unshift(getCommentForWeb(comment));

    yield put(createCommentSuccess(comments));
    yield put(sendingEnd());
    yield put(setNotificationMessage(t('Комментарий успешно добавлен')));
  } catch (e) {
    logger.error('[comments sagaCreateComment saga error', e.message);
  }
}

function* sagaUpdateComment({ api, logger }, action) {
  try {
    yield put(sendingStart());
    yield api.comments.update(action.payload);

    let comments = yield select(selectAllComments);
    const commentIndex = comments.findIndex(comment => comment.id === action.payload.id);

    comments[commentIndex].text = action.payload.text;

    yield put(updateCommentSuccess(comments));
    yield put(sendingEnd());

    //  get all data about updated comment from server
    const updatedComment = yield api.comments.getCommentById(action.payload.id);

    comments = yield select(selectAllComments);
    comments[commentIndex] = { ...comments[commentIndex], ...updatedComment };
    yield put(updateCommentSuccess(comments));
    yield put(setNotificationMessage(t('Комментарий успешно отредактирован')));
  } catch (e) {
    logger.error('[comments sagaUpdateComment saga error', e.message);
  }
}

function* sagaDeleteComment({ api, logger }, action) {
  try {
    yield api.comments.delete(action.payload);

    const comments = yield select(selectAllComments);
    const index = comments.findIndex(comment => comment.id === action.payload);

    if (index !== -1) {
      comments.splice(index, 1);
    }

    yield put(deleteCommentSuccess(comments));
    yield put(setNotificationMessage(t('Комментарий успешно удален')));
  } catch (e) {
    logger.error('[comments sagaDeleteComment saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getComments().type, sagaGetComments, ea);
  yield takeLatest(createCommentRequest().type, sagaCreateComment, ea);
  yield takeLatest(updateCommentRequest().type, sagaUpdateComment, ea);
  yield takeLatest(deleteCommentRequest().type, sagaDeleteComment, ea);
}

export default saga;
