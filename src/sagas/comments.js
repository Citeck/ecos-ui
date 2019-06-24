import { delay } from 'redux-saga';
import { put, takeLatest, call, select } from 'redux-saga/effects';
import {
  createCommentRequest,
  createCommentSuccess,
  deleteComment,
  deleteCommentRequest,
  deleteCommentSuccess,
  fetchEnd,
  fetchStart,
  getComments,
  pushComment,
  sendingEnd,
  sendingStart,
  setComments,
  updateCommentRequest,
  updateCommentSuccess
} from '../actions/comments';
import { selectAllComments } from '../selectors/comments';
import { getCommentForWeb } from '../dto/comments';

function* sagaGetComments({ api, logger }, action) {
  try {
    yield put(fetchStart());

    const { records, ...other } = yield api.comments.getAll(action.payload);

    yield put(
      setComments({
        comments: records.map(record => getCommentForWeb(record)),
        ...other
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
  } catch (e) {
    logger.error('[comments sagaCreateComment saga error', e.message);
  }
}

function* sagaUpdateComment({ api, logger }, action) {
  try {
    yield put(sendingStart());
    yield api.comments.update(action.payload);

    const comments = yield select(selectAllComments);

    comments.find(comment => comment.id === action.payload.id).text = action.payload.text;

    yield put(updateCommentSuccess(comments));
    yield put(sendingEnd());
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
