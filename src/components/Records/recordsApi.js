import lodashGet from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';

import ecosFetch from '../../helpers/ecosFetch';
import { t } from '../../helpers/util';
import { SETTING_ENABLE_RECORDS_API_DEBUG } from '../../pages/DevTools/constants';

import { DELETE_URL, MUTATE_URL, QUERY_URL } from './constants';
import { getSourceId } from './utils/recordUtils';

/**
 * Request identification
 * @param url
 * @param body
 * @return url{String}
 */
function getRecognizableUrl(url, body) {
  let urlKey = '';

  if (body.query) {
    urlKey = 'q_';
    if (body.query.sourceId) {
      urlKey += body.query.sourceId;
    } else if (body.query.ecosType) {
      urlKey += 't_' + body.query.ecosType;
    } else {
      urlKey += (JSON.stringify(body.query.query) || '').substring(0, 15);
    }
  } else if (body.record) {
    urlKey = `rec_${body.record}`;
  } else if (body.records) {
    const sourceId = getSourceId(lodashGet(body, 'records[0]', ''));
    urlKey = `recs_count_${(body.records || []).length}_${sourceId}`;
  }

  url += '?k=' + urlKey.replace(/[^A-Z0-9]+/gi, '_');

  return url;
}

function recordsFetch(url, body, signal) {
  if (!body.msgLevel && localStorage.getItem(SETTING_ENABLE_RECORDS_API_DEBUG) === 'true') {
    body.msgLevel = 'DEBUG';
  }

  body.version = 1;

  url = getRecognizableUrl(url, body);

  return ecosFetch(url, { method: 'POST', body, signal }).then(response => {
    return response.json().then(body => {
      if (response.ok) {
        checkRespMessages(body.messages);
        return body;
      }
      if (body.messages) {
        checkRespMessages(body.messages);
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

export function recordsDeleteFetch(body, signal) {
  return recordsFetch(DELETE_URL, body, signal);
}

export function recordsQueryFetch(body, signal) {
  return recordsFetch(QUERY_URL, body, signal);
}

export function recordsMutateFetch(body, signal) {
  return recordsFetch(MUTATE_URL, body, signal);
}

const attributesQueryBatch = {};
const pendingRequests = new Set();
const getPendingKey = (recordId, attsKeys) => `${recordId}|${attsKeys.join('|')}`;

export function loadAttribute(recordId, attribute) {
  if (attribute === '?id' || attribute === '_id' || attribute === '?assoc' || attribute === '_assoc') {
    return recordId;
  }
  if (attribute === '?localId' || attribute === '_localId') {
    const localIdDelimIdx = recordId.indexOf('@');
    if (localIdDelimIdx !== -1) {
      if (localIdDelimIdx === recordId.length - 1) {
        return '';
      } else {
        return recordId.substring(localIdDelimIdx + 1);
      }
    } else {
      return recordId;
    }
  }
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

      const body = {
        records,
        attributes: attsKeys
      };

      recordsQueryFetch(body)
        .then(result => {
          const resultRecords = result.records;
          if (!resultRecords || resultRecords.length !== records.length) {
            const errorCode = 'R-API-QB-0';
            console.error('Server Error. Code: ' + errorCode, body, result);
            throw new Error(t('server-error-occurred-with-code', { code: errorCode }));
          }
          records.forEach((recordId, idx) => {
            let rec = resultRecords[idx] || {};
            let attributes = rec.attributes || {};
            for (let attKey of attsKeys) {
              let attValue = attributes[attKey];

              if (attValue === undefined) {
                attValue = null;
              }

              lodashGet(sourceBuffer, [recordId, attKey, 'resolve'], v => console.warn('try to resolve', v))(attributes[attKey]);
              delete sourceBuffer[recordId][attKey];
            }
            pendingRequests.delete(getPendingKey(recordId, attsKeys));
          });
        })
        .catch(e => {
          for (let recordId in sourceBuffer) {
            for (let attKey of attsKeys) {
              lodashGet(sourceBuffer, [recordId, attKey, 'reject'], v => console.error('try to reject', v))(e);
              delete sourceBuffer[recordId][attKey];
            }
            pendingRequests.delete(getPendingKey(recordId, attsKeys));
          }
        });
    }, 10);
  }

  return attInfo.promise;
}
