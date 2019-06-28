import { put, select, takeEvery } from 'redux-saga/effects';
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
  setError,
  updateCommentRequest,
  updateCommentSuccess
} from '../actions/comments';
import { setNotificationMessage } from '../actions/notification';
import { selectAllComments } from '../selectors/comments';
import { getCommentForWeb } from '../dto/comments';
import { t } from '../helpers/util';

function* sagaGetComments({ api, logger }, action) {
  try {
    yield put(fetchStart(action.payload));

    const { records, ...extraProps } = yield api.comments.getAll(action.payload);

    yield put(
      setComments({
        nodeRef: action.payload,
        comments: records.map(record => getCommentForWeb(record)),
        ...extraProps
      })
    );

    yield put(fetchEnd(action.payload));
  } catch (e) {
    logger.error('[comments sagaGetComments saga error', e.message);
  }
}

function* sagaCreateComment({ api, logger }, action) {
  try {
    const {
      payload: { nodeRef, comment: text }
    } = action;

    yield put(sendingStart(nodeRef));

    const record = yield api.comments.create({ text, record: nodeRef });
    const comment = yield api.comments.getCommentById(record.id);
    const comments = yield select(state => selectAllComments(state, nodeRef));

    comment.id = record.id;
    comments.unshift(getCommentForWeb(comment));

    yield put(createCommentSuccess({ comments, nodeRef }));
    yield put(sendingEnd(nodeRef));
    yield put(setNotificationMessage(t('Комментарий успешно добавлен')));
  } catch (e) {
    yield put(
      setError({
        message: t('Ошибка отправки! Попробуйте еще раз'),
        nodeRef: action.payload.action
      })
    );
    logger.error('[comments sagaCreateComment saga error', e.message);
  }
}

function* sagaUpdateComment({ api, logger }, action) {
  try {
    const {
      payload: { comment, nodeRef }
    } = action;

    yield put(sendingStart(nodeRef));
    yield api.comments.update(action.payload.comment);

    let comments = yield select(state => selectAllComments(state, nodeRef));
    const commentIndex = comments.findIndex(item => item.id === comment.id);

    comments[commentIndex].text = comment.text;

    yield put(updateCommentSuccess({ comments, nodeRef }));
    yield put(sendingEnd(nodeRef));

    //  get all data about updated comment from server
    const updatedComment = yield api.comments.getCommentById(comment.id);

    comments = yield select(state => selectAllComments(state, nodeRef));
    comments[commentIndex] = { ...comments[commentIndex], ...updatedComment };
    yield put(updateCommentSuccess({ comments, nodeRef }));
    yield put(setNotificationMessage(t('Комментарий успешно отредактирован')));
  } catch (e) {
    logger.error('[comments sagaUpdateComment saga error', e.message);
  }
}

function* sagaDeleteComment({ api, logger }, action) {
  try {
    yield api.comments.delete(action.payload.id);

    const comments = yield select(state => selectAllComments(state, action.payload.nodeRef));
    const index = comments.findIndex(comment => comment.id === action.payload.id);

    if (index !== -1) {
      comments.splice(index, 1);
    }

    yield put(deleteCommentSuccess({ comments, nodeRef: action.payload.nodeRef }));
    yield put(setNotificationMessage(t('Комментарий успешно удален')));
  } catch (e) {
    logger.error('[comments sagaDeleteComment saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getComments().type, sagaGetComments, ea);
  yield takeEvery(createCommentRequest().type, sagaCreateComment, ea);
  yield takeEvery(updateCommentRequest().type, sagaUpdateComment, ea);
  yield takeEvery(deleteCommentRequest().type, sagaDeleteComment, ea);
}

export default saga;
