import cloneDeep from 'lodash/cloneDeep';
import _ from 'lodash';

import { getConfig } from '../config';
import Records from '../Records';
import { SOURCE_DELIMITER } from '../constants';
import { AttributesType } from '../types';

export async function replaceAttributeValues(data: any, record: any): Promise<any> {
  if (!data) {
    return {};
  }

  const mutableData = cloneDeep(data);
  const regExp = /\$\{([^}]+)\}/g;
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

      const matched = mutableData[key].match(regExp);

      if (!matched) {
        return;
      }

      const fields = matched.map((el: string) => el.substring(2, el.length - 1).trim());

      await Promise.all(
        fields.map(async (strKey: string) => {
          if (results.has(strKey)) {
            return;
          }

          let recordData: any = '';

          if (strKey === 'recordRef') {
            recordData = await Records.get(record).id;
          } else if (strKey === '$now') {
            recordData = new Date().toISOString();
          } else {
            recordData = await Records.get(record).load(strKey);
          }

          results.set(strKey, recordData);
        })
      );

      fields.forEach((field: string) => {
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

export async function replaceAttrValuesForRecord(data: any, record: any): Promise<any> {
  let recordRef: any;

  if (record) {
    recordRef = await Records.get(record).id;
  }

  if (!recordRef) {
    const { getCurrentRecordRef } = getConfig().workspace;
    recordRef = getCurrentRecordRef ? getCurrentRecordRef() : undefined;
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
export function getSourceId(recordRef: any): string {
  const hasDelimiter = typeof recordRef === 'string' && recordRef.includes(SOURCE_DELIMITER);
  return hasDelimiter ? recordRef.split(SOURCE_DELIMITER)[0] : '';
}

export function prepareAttsToLoad(attributes: AttributesType | null | undefined, attsToLoad: string[], attsAliases: string[]): void {
  if (!attributes) {
    return;
  }
  if (_.isString(attributes)) {
    attsToLoad.push(attributes);
    attsAliases.push(attributes);
  } else if (_.isArray(attributes)) {
    for (const att of attributes) {
      attsToLoad.push(att);
      attsAliases.push(att);
    }
  } else if (_.isObject(attributes)) {
    const attsObj = attributes as Record<string, string>;
    for (const attAlias in attsObj) {
      if (!attsObj.hasOwnProperty(attAlias)) {
        continue;
      }
      attsAliases.push(attAlias);
      attsToLoad.push(attsObj[attAlias]);
    }
  } else {
    throw new Error('Unknown attributes type: ' + JSON.stringify(attributes));
  }
}
