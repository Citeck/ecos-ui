import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import { recordsDeleteFetch, recordsQueryFetch } from './recordsApi';
import Record from './Record';
import uuidV4 from 'uuid/v4';

let Records;

let tmpRecordsCounter = 0;

class RecordsComponent {
  constructor() {
    this._records = {};
  }

  /**
   * @param {Array<string>|Array<Record>|string|Record} id
   * @param {?string} owner - Key to allow clean all cache by owner in internal store when all owners will be destroyed.
   *
   * @see release
   *
   * @return {Record|Array<Record>}
   */
  get(id, owner = null) {
    let record;

    if (!id) {
      record = new Record('', this);
    } else if (id instanceof Record) {
      record = id;
    } else if (isArray(id)) {
      let result = id.map(i => this.get(i));
      result.load = function() {
        return Promise.all(this.map(r => r.load.apply(r, arguments)));
      };
      return result;
    } else {
      record = this._records[id];
      if (!record) {
        record = new Record(id, this);
        this._records[id] = record;
      }
    }

    if (owner) {
      if (!record._owners) {
        record._owners = {};
      }
      record._owners[owner] = true;
    }

    return record;
  }

  create(data, owner) {
    if (!owner) {
      throw new Error('Owner is mandatory for virtual records');
    }

    if (Array.isArray(data)) {
      let result = [];
      for (let v of data) {
        let record = this.create(v, owner);
        if (record) {
          result.push(record);
        }
      }
      return result;
    }

    let id = uuidV4();
    let record = new Record(id, this);
    record._virtual = true;
    record._owners[owner] = true;

    for (let att in data) {
      if (data.hasOwnProperty(att)) {
        let attKey = att === 'id' ? '_att_id' : att;
        record.persistedAtt(attKey, data[att]);
      }
    }

    this._records[id] = record;

    return record;
  }

  releaseAll(owner) {
    if (!owner) {
      return;
    }
    for (let recId in this._records) {
      if (this._records.hasOwnProperty(recId)) {
        let record = this._records[recId];
        if (record._owners && record._owners[owner] !== undefined) {
          this.release(recId, owner);
        }
      }
    }
  }

  release(id, owner) {
    if (!id || !owner) {
      return;
    }

    let record;
    if (id instanceof Record) {
      record = id;
    } else if (isArray(id)) {
      for (let rec of id) {
        this.release(rec, owner);
      }
      return;
    } else {
      record = this._records[id];
    }

    if (!record || !record._owners) {
      return;
    }

    delete record._owners[owner];

    if (Object.keys(record._owners).length === 0) {
      this.forget(record.id);
    }
  }

  forget(id) {
    if (isArray(id)) {
      for (let idElem of id) {
        this.forget(idElem);
      }
    } else {
      if (!isString(id) && id.id) {
        id = id.id;
      }
      delete this._records[id];
    }
  }

  getRecordToEdit(id) {
    let record = this.get(id);
    if (!record.isBaseRecord()) {
      return record;
    }
    let tmpId = id + '-alias-' + tmpRecordsCounter++;
    let result = new Record(tmpId, this, record);
    this._records[tmpId] = result;
    return result;
  }

  remove(records) {
    if (!Array.isArray(records)) {
      records = [records];
    }

    records = records.map(r => (r.id ? r.id : r));
    return recordsDeleteFetch({ records }).then(() => this.forget(records));
  }

  queryOne(query, attributes, defaultResult = null) {
    query = cloneDeep(query);

    let page = query.page || {};
    page.maxItems = 1;

    query.page = page;

    return this.query(query, attributes).then(resp => {
      if (resp.records.length === 0) {
        return defaultResult;
      }
      if (attributes && isString(attributes)) {
        return resp.records[0][attributes];
      }
      return resp.records[0];
    });
  }

  query(query, attributes, foreach) {
    if (query.attributes && arguments.length === 1) {
      attributes = query.attributes;
      query = query.query;
    }

    let self = this;

    let attributesMapping = {};

    let isSingleAttribute = attributes && isString(attributes);
    let queryAttributes = isSingleAttribute ? [attributes] : attributes || {};

    if (attributes) {
      if (Array.isArray(queryAttributes)) {
        for (let att of queryAttributes) {
          attributesMapping[att] = att;
        }
      } else {
        for (let att in queryAttributes) {
          if (queryAttributes.hasOwnProperty(att)) {
            attributesMapping[att] = queryAttributes[att];
          }
        }
      }
    }

    const processRespRecords = respRecords => {
      let records = [];
      for (let idx in respRecords) {
        if (!respRecords.hasOwnProperty(idx)) {
          continue;
        }

        let recordMeta = respRecords[idx];

        if (recordMeta.id) {
          let record = self.get(recordMeta.id);

          for (let att in recordMeta.attributes) {
            if (recordMeta.attributes.hasOwnProperty(att)) {
              record.persistedAtt(attributesMapping[att], recordMeta.attributes[att]);
            }
          }
        }
        if (attributes) {
          records.push(
            Object.assign(
              {
                id: recordMeta.id
              },
              recordMeta.attributes
            )
          );
        } else {
          records.push(recordMeta.id);
        }
      }

      return records;
    };

    let queryBody = {
      query: query,
      attributes: queryAttributes
    };

    if (foreach) {
      queryBody.foreach = foreach;
    }

    return recordsQueryFetch(queryBody).then(response => {
      const { errors, hasMore, totalCount, records: _records } = response;
      let records;

      if (!foreach) {
        records = processRespRecords(_records);
      } else {
        const recordsArr = _records || [];
        records = [];

        for (let resRecs of recordsArr) {
          records.push(processRespRecords(resRecs));
        }
      }

      return { records, errors, hasMore, totalCount, attributes: queryBody.attributes };
    });
  }
}

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck = window.Citeck || {};
Records = window.Citeck.Records || new RecordsComponent();
window.Citeck.Records = Records;

export default Records;
