import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import queryString from 'query-string';

import Records from '../Records';
import { SOURCE_DELIMITER } from '../constants';
import _ from 'lodash';

export async function replaceAttributeValues(data, record) {
  if (!data) {
    return {};
  }

  const mutableData = cloneDeep(data);
  const regExp = /\$\{([^}]+)\}/g;
  const nonSpecialsRegex = /([^${}]+)/g;
  const keys = Object.keys(mutableData);
  const results = new Map();

  if (!keys.length) {
    return mutableData;
  }

  await Promise.all(
    keys.map(async key => {
      if (typeof mutableData[key] === 'object') {
        mutableData[key] = await replaceAttributeValues(mutableData[key], record);
        return;
      }

      if (typeof mutableData[key] !== 'string') {
        return;
      }

      let fields = mutableData[key].match(regExp);

      if (!fields) {
        return;
      }

      fields = fields.map(el => el.match(nonSpecialsRegex)[0]);

      await Promise.all(
        fields.map(async strKey => {
          if (results.has(strKey)) {
            return;
          }

          let recordData = '';

          if (strKey === 'recordRef') {
            recordData = await Records.get(record).id;
          } else {
            recordData = await Records.get(record).load(strKey);
          }

          results.set(strKey, recordData);
        })
      );

      fields.forEach(field => {
        const fieldValue = results.get(field);
        const fieldMask = '${' + field + '}';
        if (mutableData[key] === fieldMask) {
          mutableData[key] = fieldValue;
        } else {
          mutableData[key] = mutableData[key].replace(fieldMask, fieldValue);
        }
      });
    })
  );

  return mutableData;
}

export async function replaceAttrValuesForRecord(data, record) {
  let recordRef;

  if (record) {
    recordRef = await Records.get(record).id;
  }

  if (!recordRef) {
    recordRef = get(queryString.parseUrl(window.location.href), 'query.recordRef');
  }

  if (!recordRef) {
    return data;
  }

  return await replaceAttributeValues(data, recordRef);
}

/**
 * Get sourceId
 * @param recordRef
 * @return sourceId{String}
 */
export function getSourceId(recordRef) {
  const hasDelimiter = typeof recordRef === 'string' && recordRef.includes(SOURCE_DELIMITER);
  return hasDelimiter ? recordRef.split(SOURCE_DELIMITER)[0] : '';
}

export function prepareAttsToLoad(attributes, attsToLoad, attsAliases) {
  if (_.isString(attributes)) {
    attsToLoad.push(attributes);
    attsAliases.push(attributes);
  } else if (_.isArray(attributes)) {
    for (let att of attributes) {
      attsToLoad.push(att);
      attsAliases.push(att);
    }
  } else if (_.isObject(attributes)) {
    for (let attAlias in attributes) {
      if (!attributes.hasOwnProperty(attAlias)) {
        continue;
      }
      attsAliases.push(attAlias);
      attsToLoad.push(attributes[attAlias]);
    }
  } else {
    throw new Error('Unknown attributes type: ' + JSON.stringify(attributes));
  }
}
