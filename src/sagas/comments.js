import { call, put, select, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import { get } from 'lodash';

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
  setActionFailedStatus,
  setComments,
  setError,
  updateCommentRequest,
  updateCommentSuccess,
  uploadFilesInComment,
  uploadFilesFinally
} from '../actions/comments';
import { selectAllComments } from '../selectors/comments';
import { getCommentForWeb } from '../dto/comments';
import { isNodeRef, t } from '../helpers/util';
import { uploadFile, uploadFileV2 } from './documents';
import { setUploadError } from '../actions/documents';
import Records from '../components/Records/Records';
import DocumentsConverter from '../dto/documents';

const getPureMessage = message => (message || '').replace(/\d/g, '');

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
    logger.error('[comments sagaGetComments saga error', e);
  }
}

function* sagaCreateComment({ api, logger }, action) {
  try {
    const {
      payload: { recordRef, comment: text, isInternal = false }
    } = action;

    yield put(sendingStart(recordRef));

    const record = yield api.comments.create({ text, record: recordRef, isInternal });
    const comment = yield api.comments.getCommentById(record.id);
    const comments = yield select(state => selectAllComments(state, recordRef));

    comment.id = record.id;
    comments.unshift(getCommentForWeb(comment));

    yield put(createCommentSuccess({ comments, recordRef }));
    yield put(sendingEnd(recordRef));
  } catch (e) {
    const originMessage = getPureMessage(e.message);

    yield put(
      setError({
        message: originMessage || t('comments-widget.error'),
        recordRef: action.payload.recordRef
      })
    );
    logger.error('[comments sagaCreateComment saga error', e);
  } finally {
    if (action.payload && action.payload.callback && typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

function* sagaUpdateComment({ api, logger }, action) {
  try {
    const {
      payload: { comment, recordRef: nodeRef }
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
    comments[commentIndex] = { ...comments[commentIndex], ...getCommentForWeb(updatedComment) };
    yield put(updateCommentSuccess({ comments, nodeRef }));
  } catch (e) {
    const originMessage = getPureMessage(e.message);

    yield put(
      setError({
        message: originMessage || t('comments-widget.error'),
        nodeRef: action.payload.nodeRef
      })
    );
    logger.error('[comments sagaUpdateComment saga error', e);
  } finally {
    if (action.payload && action.payload.callback && typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

function* sagaUploadFilesInComment({ api, logger }, { payload }) {
  let fileRecords;

  try {
    const createVariants = yield call(api.documents.getCreateVariants, payload.type);

    let fileUploadFunc;
    if (isNodeRef(payload.record)) {
      fileUploadFunc = uploadFile;
    } else {
      fileUploadFunc = uploadFileV2;
    }
    const files = yield payload.files.map(function*(file) {
      return yield fileUploadFunc({ api, file, callback: payload.callback });
    });

    let recordRef = get(createVariants, 'recordRef');
    if (!recordRef) {
      recordRef = (yield Records.get(payload.type).load('sourceId')) + '@';
    }

    fileRecords = yield files.map(function*(file) {
      const record = yield call(
        api.documents.uploadFilesWithNodes,
        DocumentsConverter.getUploadAttributes({
          record: payload.record,
          type: payload.type,
          content: file,
          createVariants
        }),
        recordRef
      );

      return {
        ...file,
        fileRecordId: record.id
      };
    });
    NotificationManager.success(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.success' : 'documents-widget.notification.add-one.success')
    );
  } catch (e) {
    yield put(setUploadError({ ...payload, message: e.message }));
    logger.error('[comments sagaUploadFilesInComment saga error', e);
    NotificationManager.error(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.error' : 'documents-widget.notification.add-one.error'),
      t('error')
    );
  } finally {
    yield put(uploadFilesFinally(payload.key));
    if (payload.uploadCallback) {
      yield call(payload.uploadCallback, fileRecords);
    }
  }
}

function* sagaDeleteComment({ api, logger }, { payload }) {
  try {
    yield put(sendingStart(payload.nodeRef));
    yield api.comments.delete(payload.id);

    const comments = yield select(state => selectAllComments(state, payload.nodeRef));
    const index = comments.findIndex(comment => comment.id === payload.id);

    if (index !== -1) {
      comments.splice(index, 1);
    }

    yield put(deleteCommentSuccess({ comments, nodeRef: payload.nodeRef }));
  } catch (e) {
    const originMessage = getPureMessage(e.message);

    NotificationManager.error(originMessage || t('comments-widget.error'), t('error'));
    yield put(setActionFailedStatus({ nodeRef: payload.nodeRef, status: true }));

    logger.error('[comments sagaDeleteComment saga error', e);
  } finally {
    yield put(sendingEnd(payload.nodeRef));

    if (payload.callback && typeof payload.callback === 'function') {
      payload.callback();
    }

    yield put(setActionFailedStatus({ nodeRef: payload.nodeRef, status: false }));
  }
}

function* saga(ea) {
  yield takeEvery(uploadFilesInComment().type, sagaUploadFilesInComment, ea);
  yield takeEvery(getComments().type, sagaGetComments, ea);
  yield takeEvery(createCommentRequest().type, sagaCreateComment, ea);
  yield takeEvery(updateCommentRequest().type, sagaUpdateComment, ea);
  yield takeEvery(deleteCommentRequest().type, sagaDeleteComment, ea);
}

export default saga;
