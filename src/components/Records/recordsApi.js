import lodashGet from 'lodash/get';
import { ecosFetch } from '../../helpers/ecosWrappers';

const QUERY_URL = '/share/proxy/alfresco/citeck/ecos/records/query';
const DELETE_URL = '/share/proxy/alfresco/citeck/ecos/records/delete';
const MUTATE_URL = '/share/proxy/alfresco/citeck/ecos/records/mutate';

const GATEWAY_URL_MAP = {};
GATEWAY_URL_MAP[QUERY_URL] = '/share/api/records/query';
GATEWAY_URL_MAP[MUTATE_URL] = '/share/api/records/mutate';
GATEWAY_URL_MAP[DELETE_URL] = '/share/api/records/delete';

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
  if (record.id) {
    record = record.id;
  }
  let sourceDelimIdx = record.indexOf('@');
  let appDelimIdx = record.indexOf('/');
  return appDelimIdx > 0 && appDelimIdx < sourceDelimIdx;
}

function recordsFetch(url, body) {
  //for request identification
  let urlKey = '';

  let withAppName = false;
  if (body.query) {
    urlKey = 'q_' + (body.query.sourceId || '');
    withAppName = lodashGet(body, 'query.sourceId', '').indexOf('/') > -1;
  } else if (body.record) {
    urlKey = 'rec_' + body.record;
    withAppName = isRecordWithAppName(body.record);
  } else if (body.records) {
    urlKey = 'recs_' + (body.records[0] || '');
    withAppName = isAnyWithAppName(body.records);
  }

  if (withAppName) {
    url = GATEWAY_URL_MAP[url];
  }

  url += '?k=' + encodeURIComponent(urlKey);

  return ecosFetch(url, { headers: { 'Content-type': 'application/json;charset=UTF-8' }, body }).then(response => {
    return response.json().then(body => {
      if (response.ok) {
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
      delete attributesQueryBatch[recordId];

      const attsKeys = Object.keys(attributesBatch);

      recordsQueryFetch({
        record: recordId,
        attributes: attsKeys
      })
        .then(result => {
          let attributes = result.attributes || {};
          for (let key of attsKeys) {
            attributesBatch[key].resolve(attributes[key]);
          }
        })
        .catch(e => {
          for (let key of attsKeys) {
            attributesBatch[key].reject(e);
          }
        });
    }, 10);
  }

  return attInfo.promise;
}
