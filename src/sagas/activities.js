import get from 'lodash/get';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import {
  createActivityRequest,
  createActivitySuccess,
  deleteActivityRequest,
  deleteActivitySuccess,
  fetchEnd,
  fetchStart,
  getActivities,
  sendingEnd,
  sendingStart,
  setActionFailedStatus,
  setActivities,
  setError,
  updateActivityRequest,
  updateActivitySuccess,
  uploadFilesInActivity,
  uploadFilesFinally,
  viewAssignment
} from '../actions/activities';
import { setUploadError } from '../actions/documents';
import Records from '../components/Records/Records';
import { ActionTypes } from '../components/Records/actions/constants';
import { EVENTS } from '../components/widgets/BaseWidget';
import { COMMENT_TYPE, SourcesId } from '../constants';
import { ActivityTypes } from '../constants/activity';
import { getCommentForWeb } from '../dto/activities';
import { t } from '../helpers/util';
import { selectAllActivities } from '../selectors/activities';

import { uploadFileV2 } from './documents';

import { NotificationManager } from '@/services/notifications';

const getPureMessage = message => (message || '').replace(/\d/g, '');

function* sagaGetActivities({ api }, action) {
  try {
    yield put(fetchStart(action.payload));

    const { records: activityTypes = [] } = yield api.activities.getTypes(action.payload);
    const { records, ...extraProps } = yield api.activities.getAll(action.payload);

    yield put(
      setActivities({
        recordRef: action.payload,
        activityTypes,
        activities: records.map(record => getCommentForWeb(record)),
        ...extraProps
      })
    );

    yield put(fetchEnd(action.payload));
  } catch (e) {
    console.error('[activities sagaGetActivities saga error', e);
  }
}

function* sagaCreateActivity({ api }, action) {
  try {
    const {
      payload: { recordRef, activity: text, instanceRecord, ...rest }
    } = action;

    yield put(sendingStart(recordRef));

    const record = yield api.activities.create({ text, record: recordRef, ...rest });
    const activity = yield api.activities.getActivityById(record.id);
    const activities = yield select(state => selectAllActivities(state, recordRef));

    activity.id = record.id;
    activities.unshift(getCommentForWeb(activity));

    yield put(createActivitySuccess({ activities, recordRef }));

    const typeId = get(rest, 'selectedType.id');

    if (typeId) {
      switch (typeId) {
        case ActivityTypes.ASSIGNMENT:
          instanceRecord.events.emit(EVENTS.UPDATE_ASSOCIATIONS);
          break;
        case ActivityTypes.COMMENT:
          instanceRecord.events.emit(EVENTS.UPDATE_COMMENTS);
          break;
        default:
          break;
      }
    }

    yield put(sendingEnd(recordRef));
  } catch (e) {
    const originMessage = getPureMessage(e.message);

    yield put(
      setError({
        message: originMessage || t('activities-widget.error'),
        recordRef: action.payload.recordRef
      })
    );
    console.error('[activities sagaCreateActivity saga error', e);
  } finally {
    if (action.payload && action.payload.callback && typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

function* sagaUpdateActivity({ api }, action) {
  try {
    const {
      payload: { recordRef, activity, initiator, performer, instanceRecord, responsible, ...rest }
    } = action;
    yield put(sendingStart(recordRef));

    let initiatorId = isObject(initiator) ? get(initiator, 'authorityName', '') : initiator;
    let performerId = isObject(performer) ? get(performer, 'authorityName', '') : performer;
    let responsibleId = isObject(responsible) ? get(responsible, 'authorityName', '') : responsible;

    const handleUserId = id => (isString(id) && id.includes(SourcesId.PERSON) ? id : SourcesId.PERSON + '@' + id);

    initiatorId = handleUserId(initiatorId);
    performerId = handleUserId(performerId);
    responsibleId = handleUserId(responsibleId);

    yield api.activities.update({
      id: activity.id,
      text: activity.text,
      record: recordRef,
      initiator: initiatorId,
      performer: performerId,
      responsible: responsibleId,
      ...rest
    });

    let activities = yield select(state => selectAllActivities(state, recordRef));
    const activityIndex = activities.findIndex(item => item.id === activity.id);
    activities[activityIndex].text = activity.text;

    yield put(updateActivitySuccess({ activities, recordRef }));

    //  get all data about updated comment from server
    const updatedComment = yield api.activities.getActivityById(activity.id);

    activities = yield select(state => selectAllActivities(state, recordRef));
    activities[activityIndex] = { ...activities[activityIndex], ...getCommentForWeb(updatedComment) };

    yield put(updateActivitySuccess({ activities, recordRef }));

    const typeId = get(rest, 'selectedType.id');
    if (typeId) {
      switch (typeId) {
        case ActivityTypes.ASSIGNMENT:
          instanceRecord.events.emit(EVENTS.UPDATE_ASSOCIATIONS);
          break;
        case ActivityTypes.COMMENT:
        case COMMENT_TYPE:
          instanceRecord.events.emit(EVENTS.UPDATE_COMMENTS);
          break;
        default:
          break;
      }
    }

    yield put(sendingEnd(recordRef));
  } catch (e) {
    const originMessage = getPureMessage(e.message);

    yield put(
      setError({
        message: originMessage || t('comments-widget.error'),
        recordRef: action.payload.recordRef
      })
    );
    console.error('[activities sagaUpdateActivity saga error', e);
  } finally {
    if (action.payload && action.payload.callback && typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

function* sagaUploadFilesInActivity({ api }, { payload }) {
  let fileRecords;

  try {
    const createVariants = yield call(api.documents.getCreateVariants, payload.type);
    const fileUploadFunc = uploadFileV2;

    const files = yield payload.files.map(function* (file) {
      return yield fileUploadFunc({ api, file, callback: payload.callback });
    });

    const results = yield Promise.allSettled(files);

    const rejected = results.find(result => result.status === 'rejected');
    if (rejected) {
      throw new Error('One or more file uploads failed');
    }

    let recordRef = get(createVariants, 'recordRef');
    if (!recordRef) {
      recordRef = (yield Records.get(payload.type).load('sourceId')) + '@';
    }

    fileRecords = yield files.map(function (file, index) {
      const fileResult = results[index];

      if (fileResult.status === 'fulfilled') {
        return { ...fileResult.value, fileRecordId: get(file, 'data.entityRef') };
      } else {
        throw fileResult.reason;
      }
    });
    NotificationManager.success(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.success' : 'documents-widget.notification.add-one.success')
    );
  } catch (e) {
    yield put(setUploadError({ ...payload, message: e.message }));
    console.error('[activities sagaUploadFilesInActivity saga error', e);
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

function* sagaDeleteActivity({ api }, { payload }) {
  const { recordRef, id: activityId, callback } = payload;

  try {
    yield put(sendingStart(recordRef));
    yield api.activities.delete(activityId);

    const activities = yield select(state => selectAllActivities(state, recordRef));
    const index = activities.findIndex(activity => activity.id === activityId);

    if (index !== -1) {
      activities.splice(index, 1);
    }

    yield put(deleteActivitySuccess({ activities, recordRef }));
  } catch (e) {
    const originMessage = getPureMessage(e.message);

    NotificationManager.error(originMessage || t('comments-widget.error'), t('error'));
    yield put(setActionFailedStatus({ recordRef, status: true }));

    console.error('[activities sagaDeleteActivity saga error', e);
  } finally {
    yield put(sendingEnd(recordRef));

    if (callback && typeof callback === 'function') {
      callback();
    }

    yield put(setActionFailedStatus({ recordRef, status: false }));
  }
}

function* sagaViewAssignment({ api }, { payload }) {
  try {
    yield call(api.recordActions.executeAction, {
      records: payload,
      action: { type: ActionTypes.VIEW }
    });
  } catch (e) {
    NotificationManager.error(t('doc-associations-widget.view-association.error.message'), t('error'));
    console.error('[docAssociations sagaViewAssignment saga error', e);
  }
}

function* saga(ea) {
  yield takeEvery(uploadFilesInActivity().type, sagaUploadFilesInActivity, ea);
  yield takeEvery(getActivities().type, sagaGetActivities, ea);
  yield takeEvery(createActivityRequest().type, sagaCreateActivity, ea);
  yield takeEvery(updateActivityRequest().type, sagaUpdateActivity, ea);
  yield takeEvery(deleteActivityRequest().type, sagaDeleteActivity, ea);
  yield takeEvery(viewAssignment().type, sagaViewAssignment, ea);
}

export default saga;
