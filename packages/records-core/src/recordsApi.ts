import lodashGet from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';

import { getConfig } from './config';
import { DELETE_URL, MUTATE_URL, QUERY_URL, SETTING_ENABLE_RECORDS_API_DEBUG } from './constants';
import { getSourceId } from './utils/recordUtils';

/**
 * Request identification — appends a recognizable `?k=` key for caching/debug.
 */
function getRecognizableUrl(url: string, body: any): string {
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

function recordsFetch(url: string, body: any, signal?: AbortSignal): Promise<any> {
  const { http, storage } = getConfig();

  if (!body.msgLevel && storage && storage.getItem(SETTING_ENABLE_RECORDS_API_DEBUG) === 'true') {
    body.msgLevel = 'DEBUG';
  }

  body.version = 1;

  url = getRecognizableUrl(url, body);

  return http(url, { method: 'POST', body, signal }).then(response => {
    return response.json().then((respBody: any) => {
      if (response.ok) {
        checkRespMessages(respBody.messages);
        return respBody;
      }
      if (respBody.messages) {
        checkRespMessages(respBody.messages);
      }
      if (respBody.message) {
        throw new Error(respBody.message);
      } else {
        throw new Error(response.statusText);
      }
    });
  });
}

function checkRespMessages(messages: any[]): void {
  if (!messages || messages.length === 0) {
    return;
  }

  for (const message of messages) {
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

export function recordsDeleteFetch(body: any, signal?: AbortSignal): Promise<any> {
  return recordsFetch(DELETE_URL, body, signal);
}

export function recordsQueryFetch(body: any, signal?: AbortSignal): Promise<any> {
  return recordsFetch(QUERY_URL, body, signal);
}

export function recordsMutateFetch(body: any, signal?: AbortSignal): Promise<any> {
  return recordsFetch(MUTATE_URL, body, signal);
}

interface AttInfo {
  promise: Promise<any>;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

const attributesQueryBatch: Record<string, Record<string, AttInfo>> = {};
const pendingRequests = new Set<string>();
const getPendingKey = (recordId: string, attsKeys: string[]): string => `${recordId}|${attsKeys.join('|')}`;

export function loadAttribute(recordId: string, attribute: string): any {
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
    attInfo = {} as AttInfo;
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
      const sourceBuffer: Record<string, Record<string, AttInfo>> = { [recordId]: attributesQueryBatch[recordId] };
      delete attributesQueryBatch[recordId];

      if (pendingRequests.has(getPendingKey(recordId, attsKeys))) {
        return;
      }

      Object.keys(attributesQueryBatch).forEach(otherId => {
        if (sourceId === getSourceId(otherId) && isEqual(attsKeys, Object.keys(attributesQueryBatch[otherId]))) {
          records.push(otherId);
          pendingRequests.add(getPendingKey(otherId, attsKeys));
          sourceBuffer[otherId] = attributesQueryBatch[otherId];
        }
      });

      const body = {
        records,
        attributes: attsKeys
      };

      recordsQueryFetch(body)
        .then((result: any) => {
          const resultRecords = result.records;
          if (!resultRecords || resultRecords.length !== records.length) {
            const errorCode = 'R-API-QB-0';
            console.error('Server Error. Code: ' + errorCode, body, result);
            throw new Error(getConfig().i18n.t('server-error-occurred-with-code', { code: errorCode }));
          }
          records.forEach((curId, idx) => {
            const rec = resultRecords[idx] || {};
            const attributes = rec.attributes || {};
            for (const attKey of attsKeys) {
              let attValue = attributes[attKey];

              if (attValue === undefined) {
                attValue = null;
              }

              lodashGet(sourceBuffer, [curId, attKey, 'resolve'], (v: any) => console.warn('try to resolve', v))(attributes[attKey]);
              delete sourceBuffer[curId][attKey];
            }
            pendingRequests.delete(getPendingKey(curId, attsKeys));
          });
        })
        .catch((e: any) => {
          for (const curId in sourceBuffer) {
            for (const attKey of attsKeys) {
              lodashGet(sourceBuffer, [curId, attKey, 'reject'], (v: any) => console.error('try to reject', v))(e);
              delete sourceBuffer[curId][attKey];
            }
            pendingRequests.delete(getPendingKey(curId, attsKeys));
          }
        });
    }, 10);
  }

  return attInfo.promise;
}
