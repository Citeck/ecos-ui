import React from 'react';
import { NotificationManager } from 'react-notifications';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';

import { t } from '../../../../helpers/export/util';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';
import Records from '../../Records';
import { getBool, extractLabel, isNodeRef } from '../../../../helpers/util';
import DialogManager from '../../../common/dialogs/Manager';
import ExecuteInfoAction from '../components/ExecuteInfoAction';

const Labels = {
  MSG_SUCCESS: 'record-action.msg.success.text',
  TITLE_SUCCESS: 'record-action.msg.success.title',
  MSG_ERR: 'record-action.msg.error.text',
  TITLE_ERR: 'record-action.msg.error.title',
  MSG_START: 'waiting',
  TITLE_START: 'record-action.msg.info.started',
  RESULT_TITLE: 'group-action.label.header',
  FETCH_DATA: 'group-action.label.fetch-data',
  STARTED: 'group-action.message.started',
  IN_PROGRESS: 'group-action.message.in-progress',
  CONFIRM: 'journals.action.confirm.title',
  CONFIRM_REPLACE: 'journals.action.change-value.message',
  BTN_CANCEL: 'btn.cancel.label',
  BTN_CONFIRM: 'btn.confirm.label'
};

function getRef(record) {
  return isNodeRef(record) ? record : record.id || record.recordRef || record.nodeRef;
}

export function showDetailActionResult(info, options = {}) {
  const { callback, title, withConfirm, ...opt } = options;
  let buttons = [];

  if (withConfirm) {
    buttons = [
      { label: Labels.BTN_CANCEL, onClick: () => callback && callback(false) },
      { label: Labels.BTN_CONFIRM, onClick: () => callback && callback(true), className: 'ecos-btn_blue' }
    ];
  }

  return DialogManager.showCustomDialog({
    title,
    body: <ExecuteInfoAction type={info.type} data={info.data} options={opt} />,
    buttons,
    onHide: () => callback && callback(false)
  });
}

function formatArrayResult(data) {
  const url = get(data, '[0].url');
  const error = get(data, '[0].error');

  if (url) {
    return { type: ResultTypes.LINK, data: { url } };
  }

  if (error) {
    return { type: ResultTypes.ERROR, data: { message: error } };
  }

  return { type: ResultTypes.RESULTS, data: { results: Array.from(data) } };
}

export const ResultTypes = {
  LINK: 'link',
  RESULTS: 'results',
  ERROR: 'error'
};

export function notifySuccess(msg, timeOut = 5000, ...extra) {
  const before = cloneDeep(NotificationManager.listNotify);

  NotificationManager.success(t(msg || Labels.MSG_SUCCESS), t(Labels.TITLE_SUCCESS), timeOut, ...extra);

  const diff = difference(NotificationManager.listNotify, before);

  if (diff.length > 1) {
    return NotificationManager.listNotify[NotificationManager.listNotify.length - 1];
  }

  return diff[0];
}

export function notifyFailure(msg, timeOut = 5000, ...extra) {
  const before = cloneDeep(NotificationManager.listNotify);

  NotificationManager.error(t(msg || Labels.MSG_ERR), t(Labels.TITLE_ERR), timeOut, ...extra);

  const diff = difference(NotificationManager.listNotify, before);

  if (diff.length > 1) {
    return NotificationManager.listNotify[NotificationManager.listNotify.length - 1];
  }

  return diff[0];
}

export function notifyStart(msg, timeOut = 5000, ...extra) {
  const before = cloneDeep(NotificationManager.listNotify);

  NotificationManager.info(t(msg || Labels.MSG_START), t(Labels.TITLE_START), timeOut, ...extra);

  const diff = difference(NotificationManager.listNotify, before);

  if (diff.length > 1) {
    return NotificationManager.listNotify[NotificationManager.listNotify.length - 1];
  }

  return diff[0];
}

export function removeNotify(notify) {
  NotificationManager.remove(notify);
}

export function showForm(recordRef, params, className = '') {
  const _class = `${!className.includes('ecos-modal_width') && 'ecos-modal_width-lg'} ${className}`;

  EcosFormUtils.eform(recordRef, {
    params,
    class: _class,
    isBigHeader: true
  });
}

export function prepareResult(result) {
  if (isBoolean(result)) {
    return result;
  }

  if (Array.isArray(result)) {
    return formatArrayResult(result);
  }

  if (result.error) {
    console.error(result.error);
    return { type: ResultTypes.ERROR, data: { message: result.error } };
  }

  return {
    type: result.type,
    data: result.data
  };
}

export function packedActionStatus(status = '') {
  if (isEmpty(status)) {
    return t('batch-edit.message.no-status');
  }

  return t(`batch-edit.message.${status}`);
}

export function getActionResultTitle(action) {
  return t(Labels.RESULT_TITLE, { action: extractLabel(get(action, 'config.title') || action.name) });
}

export function setDisplayDataRecord(record, status = '', message = '') {
  const nodeRef = getRef(record);

  return {
    title: record.disp || nodeRef,
    nodeRef,
    status,
    message
  };
}

export async function prepareBatchEditAction(groupActionData) {
  const { groupAction, selected, callback, query = null } = groupActionData;
  const attributeName = groupAction.params['form_option_batch-edit-attribute'];
  const params = groupAction.params || {};

  const records = await Promise.all(
    selected.map(id =>
      Records.get(id)
        .load(
          {
            valueDisp: attributeName + '?disp',
            value: attributeName + '?str',
            disp: '.disp'
          },
          true
        )
        .then(res => ({ ...res, id }))
    )
  );

  const resolvedRecords = [];
  const recordsToChange = [];

  for (let rec of records) {
    const value = rec.value;

    let isEmptyValue = true;
    if (value && value instanceof Array && value.length > 0) {
      isEmptyValue = false;
    } else if (value && !(value instanceof Array)) {
      isEmptyValue = false;
    }

    if (!isEmptyValue) {
      if (getBool(params.changeExistsValue) !== true) {
        resolvedRecords.push({ ...rec, status: 'SKIPPED' });
      } else {
        if (getBool(params.confirmChange) === true) {
          const confirmRes = await new Promise(resolve => {
            DialogManager.confirmDialog({
              title: t(Labels.CONFIRM),
              text: t(Labels.CONFIRM_REPLACE, { name: rec.disp, value: rec.valueDisp }),
              onNo: () => resolve(false),
              onYes: () => resolve(true)
            });
          });

          if (confirmRes) {
            recordsToChange.push(rec.id);
          } else {
            resolvedRecords.push({ ...rec, status: 'CANCELLED' });
          }
        } else {
          recordsToChange.push(rec.id);
        }
      }
    } else {
      if (params.skipEmptyValues === true) {
        resolvedRecords.push({ ...rec, status: 'SKIPPED' });
      } else {
        recordsToChange.push(rec.id);
      }
    }
  }

  return callback({
    groupAction,
    selected: recordsToChange,
    resolved: resolvedRecords,
    query
  });
}

export const DetailActionResult = {
  showPreviewRecords: async (records = [], options = {}) => {
    DetailActionResult.options = { ...(DetailActionResult.options || {}), ...options, isLoading: !options.withoutLoader };
    const res = results => ({ type: ResultTypes.RESULTS, data: { results } });

    const prepRecords = records.map(id => {
      if (!isEmpty(options.forRecords) && options.forRecords.includes(id)) {
        // set(options, ['statusesByRecords', id], t(Labels.STARTED));
        options.statusesByRecords[id] = t(Labels.STARTED);

        return setDisplayDataRecord({ id, disp: t(Labels.FETCH_DATA) }, t(Labels.STARTED));
      }

      return setDisplayDataRecord({ id, disp: t(Labels.FETCH_DATA) }, t(get(options, ['statusesByRecords', id])));
    });
    showDetailActionResult(res(prepRecords), DetailActionResult.options);

    const previewRecords = await Promise.all(
      records.map(id =>
        Records.get(id)
          .load('.disp')
          .then(disp => {
            if (!isEmpty(options.forRecords) && options.forRecords.includes(id)) {
              set(options, ['statusesByRecords', id], t(Labels.IN_PROGRESS));

              return setDisplayDataRecord({ id, disp }, t(Labels.IN_PROGRESS));
            }

            return setDisplayDataRecord({ id, disp }, t(get(options, ['statusesByRecords', id])));
          })
      )
    );

    return showDetailActionResult(res(previewRecords), DetailActionResult.options);
  },

  showResult: async (result = {}, options) => {
    DetailActionResult.options = { ...DetailActionResult.options, ...options, isLoading: false };
    const res = prepareResult(cloneDeep(result));

    if (!Object.values(ResultTypes).includes(get(res, 'type'))) {
      return;
    }

    if (get(res, 'data.results')) {
      const needNames = res.data.results.filter(r => !r.disp);
      if (needNames.length) {
        const names = await Promise.all(
          needNames.map(r =>
            Records.get(getRef(r))
              .load('.disp')
              .then(disp => ({ disp, id: getRef(r) }))
          )
        );

        res.data.results.forEach(r => {
          const name = names.find(({ id }) => id === getRef(r));

          name && (r.disp = name.disp);
        });
      }

      res.data.results = res.data.results.map(r => {
        const id = getRef(r);
        let status = packedActionStatus(r.status);

        if (!isEmpty(options.forRecords)) {
          status = options.forRecords.includes(id) ? packedActionStatus(r.status) : get(options, ['statusesByRecords', id]);
        }

        return setDisplayDataRecord(r, status, r.message);
      });
    }

    return new Promise(resolve => showDetailActionResult(res, { ...DetailActionResult.options, callback: resolve }));
  }
};
