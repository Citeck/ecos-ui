import cloneDeep from 'lodash/cloneDeep';

import Records from '../Records';

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
