import lodashGet from 'lodash/get';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';

import ecosFetch from '../../helpers/ecosFetch';

import { getSourceId } from './utils/recordUtils';
import { APP_DELIMITER, DELETE_URL, GATEWAY_URL_MAP, MUTATE_URL, QUERY_URL, SOURCE_DELIMITER } from './constants';

function isAnyWithAppName(records) {
  for (let i = 0; i < records.length; i++) {
    if (isRecordWithAppName(records[i])) {
      return true;
    }
  }
}

function isRecordWithAppName(record) {
  if (!record) {
    return false;
  }
  if (isString(record.id)) {
    record = record.id;
  }

  if (isString(record)) {
    const sourceDelimIdx = record.indexOf(SOURCE_DELIMITER);
    const appDelimIdx = record.indexOf(APP_DELIMITER);
    return appDelimIdx > 0 && appDelimIdx < sourceDelimIdx;
  }

  return '';
}

/**
 * Request identification
 * @param url
 * @param body
 * @return url{String}
 */
function getRecognizableUrl(url, body) {
  let urlKey = '';
  let withAppName = false;

  if (body.query) {
    urlKey = 'q_' + (body.query.sourceId ? body.query.sourceId : (JSON.stringify(body.query.query) || '').substring(0, 15));
    withAppName = lodashGet(body, 'query.sourceId', '').indexOf(APP_DELIMITER) > -1;
  } else if (body.record) {
    urlKey = `rec_${body.record}`;
    withAppName = isRecordWithAppName(body.record);
  } else if (body.records) {
    const sourceId = getSourceId(lodashGet(body, 'records[0]', ''));
    urlKey = `recs_count_${(body.records || []).length}_${sourceId}`;
    withAppName = isAnyWithAppName(body.records);
  }

  if (withAppName) {
    url = GATEWAY_URL_MAP[url];
  }

  url += '?k=' + encodeURIComponent(urlKey);

  return url;
}

function recordsFetch(url, body) {
  if (url.indexOf('mutate') >= 0 || url.indexOf('delete') >= 0) {
    body.version = 1;
  }
  url = getRecognizableUrl(url, body);

  return ecosFetch(url, { method: 'POST', body }).then(response => {
    return response.json().then(body => {
      if (response.ok) {
        checkRespMessages(body.messages);
        return body;
      }

      if (body.message) {
        throw new Error(body.message);
      } else {
        throw new Error(response.statusText);
      }
    });
  });
}

function checkRespMessages(messages) {
  if (!messages || messages.length === 0) {
    return;
  }

  for (let message of messages) {
    if (message.level === 'ERROR') {
      let errorMessage = message.msg || 'Server error';
      if (!isString(errorMessage)) {
        if (message.type === 'records-error') {
          errorMessage = errorMessage.msg;
        } else {
          errorMessage = JSON.stringify(errorMessage);
        }
      }
      if (!errorMessage) {
        errorMessage = 'Server error';
      }
      throw new Error(errorMessage);
    }
  }
}

export function recordsDeleteFetch(body) {
  return recordsFetch(DELETE_URL, body);
}

export function recordsQueryFetch(body) {
  return recordsFetch(QUERY_URL, body);
}

export function recordsMutateFetch(body) {
  return recordsFetch(MUTATE_URL, body);
}

const attributesQueryBatch = {};
const pendingRequests = new Set();
const getPendingKey = (recordId, attsKeys) => `${recordId}|${attsKeys.join('|')}`;

export function loadAttribute(recordId, attribute) {
  let attributesBatch = attributesQueryBatch[recordId];
  let isNewBatch = false;
  if (!attributesBatch) {
    isNewBatch = true;
    attributesBatch = {};
    attributesQueryBatch[recordId] = attributesBatch;
  }

  let attInfo = attributesBatch[attribute];
  if (attInfo) {
    return attInfo.promise;
  } else {
    attInfo = {};
    attInfo.promise = new Promise((resolve, reject) => {
      attInfo.resolve = resolve;
      attInfo.reject = reject;
    });
    attributesBatch[attribute] = attInfo;
  }

  if (isNewBatch) {
    setTimeout(() => {
      const attsKeys = Object.keys(attributesBatch);
      const sourceId = getSourceId(recordId);
      const records = [recordId];
      const sourceBuffer = { [recordId]: attributesQueryBatch[recordId] };
      delete attributesQueryBatch[recordId];

      if (pendingRequests.has(getPendingKey(recordId, attsKeys))) {
        return;
      }

      Object.keys(attributesQueryBatch).forEach(recordId => {
        if (sourceId === getSourceId(recordId) && isEqual(attsKeys, Object.keys(attributesQueryBatch[recordId]))) {
          records.push(recordId);
          pendingRequests.add(getPendingKey(recordId, attsKeys));
          sourceBuffer[recordId] = attributesQueryBatch[recordId];
        }
      });

      let body = { attributes: attsKeys };
      if (records.length > 1) {
        body.records = records;
      } else {
        body.record = recordId;
      }

      recordsQueryFetch(body)
        .then(result => {
          const resultRecords = records.length > 1 ? result.records || [] : [result];
          resultRecords.forEach((rec, idx) => {
            let attributes = rec.attributes || {};
            const recordId = records[idx];
            for (let attKey of attsKeys) {
              sourceBuffer[recordId][attKey].resolve(attributes[attKey]);
              delete sourceBuffer[recordId][attKey];
            }
            pendingRequests.delete(getPendingKey(recordId, attsKeys));
          });
        })
        .catch(e => {
          for (let recordId in sourceBuffer) {
            for (let attKey of attsKeys) {
              sourceBuffer[recordId][attKey].reject(e);
              delete sourceBuffer[recordId][attKey];
            }
            pendingRequests.delete(getPendingKey(recordId, attsKeys));
          }
        });
    }, 10);
  }

  return attInfo.promise;
}
