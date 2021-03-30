import React from 'react';
import { NotificationManager } from 'react-notifications';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { t } from '../../../../helpers/export/util';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';
import Records from '../../Records';
import { getBool, extractLabel } from '../../../../helpers/util';
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
  return record.id || record.recordRef || record.nodeRef;
}

function showDetailActionResult(info, options) {
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

export function notifySuccess(msg) {
  NotificationManager.success(msg || t(Labels.MSG_SUCCESS), t(Labels.TITLE_SUCCESS));
}

export function notifyFailure(msg) {
  NotificationManager.error(msg || t(Labels.MSG_ERR), t(Labels.TITLE_ERR), 5000);
}

export function notifyStart(msg) {
  NotificationManager.info(msg || t(Labels.MSG_START), t(Labels.TITLE_START), 5000);
}

export function showForm(recordRef, params, className = '') {
  EcosFormUtils.eform(recordRef, {
    params,
    class: 'ecos-modal_width-lg ' + className,
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
  showPreviewRecords: async (records = [], options) => {
    DetailActionResult.options = { ...(DetailActionResult.options || {}), ...options, isLoading: true };
    const res = results => ({ type: ResultTypes.RESULTS, data: { results } });

    const prepRecords = records.map(id => setDisplayDataRecord({ id, disp: t(Labels.FETCH_DATA) }, t(Labels.STARTED)));
    showDetailActionResult(res(prepRecords), DetailActionResult.options);

    const previewRecords = await Promise.all(
      records.map(id =>
        Records.get(id)
          .load('.disp')
          .then(disp => setDisplayDataRecord({ id, disp }, t(Labels.IN_PROGRESS)))
      )
    );

    return showDetailActionResult(res(previewRecords), DetailActionResult.options);
  },

  showResult: async (result = {}, options) => {
    DetailActionResult.options = { ...DetailActionResult.options, ...options, isLoading: false };
    const res = prepareResult(cloneDeep(result));

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
          const name = names.find(({ disp, id }) => id === getRef(r));
          name && (r.disp = name.disp);
        });
      }
      res.data.results = res.data.results.map(r => setDisplayDataRecord(r, packedActionStatus(r.status), r.message));
    }

    return new Promise(resolve => showDetailActionResult(res, { ...DetailActionResult.options, callback: resolve }));
  }
};
