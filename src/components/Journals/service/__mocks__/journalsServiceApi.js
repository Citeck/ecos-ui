import lodash from 'lodash';

window.globalConfigs = window.globalConfigs || {};
window.globalRecords = window.globalRecords || {};

class JournalsServiceApi {
  setConfig(config) {
    window.globalConfigs[config.id] = config;
  }

  setRecords(records) {
    window.globalRecords = {};
    for (let record of records) {
      window.globalRecords[record.id] = record;
    }
  }

  async getJournalConfig(journalId) {
    return window.globalConfigs[journalId] || {};
  }

  async queryData(query, attributes) {
    const records = [];

    for (let rec in window.globalRecords) {
      if (window.globalRecords.hasOwnProperty(rec)) {
        let resRec = await this.loadAttributes(rec, attributes);
        if (lodash.isObject(resRec)) {
          resRec.id = rec;
        }
        records.push(resRec);
      }
    }
    return {
      records: records,
      tital: records.length,
      attributes
    };
  }

  async loadAttributes(record, attributes) {
    const recordData = window.globalRecords[record] || {};

    if (lodash.isString(attributes)) {
      return recordData[attributes];
    }
    let res = {};
    if (lodash.isArray(attributes)) {
      for (let key of attributes) {
        res[key] = recordData[key];
      }
    } else {
      for (let key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          res[key] = recordData[attributes[key]];
        }
      }
    }
    return res;
  }
}

const INSTANCE = new JournalsServiceApi();
export default INSTANCE;
