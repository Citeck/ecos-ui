import cloneDeep from 'lodash/cloneDeep';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import uuidV4 from 'uuidv4';

import RecordImpl, { RecordType } from './Record';
import recordsClientManager from './client';
import { recordsDeleteFetch, recordsQueryFetch } from './recordsApi';
import { AttributesType, PreProcessAttsType, PreProcessAttsTypeNotNil } from './types';
import { prepareAttsToLoad } from './utils/recordUtils';

import { RecordsQueryResponse } from '@/api/types';

let tmpRecordsCounter = 0;

export type RecordsContainerType = RecordsComponent;

class RecordsComponent {
  protected _records: Record<string, RecordImpl>;

  constructor() {
    this._records = {};
  }

  /**
   * @param {Array<string>|Array<Record>|string|Record} id
   * @param {?string} owner - Key to allow clean all cache by owner in internal store when all owners will be destroyed.
   **/
  get(id?: string | RecordImpl, owner?: string | null): RecordImpl;
  get(id: Array<string | RecordImpl>, owner?: string | null): RecordImpl[] & { load: RecordType['load'] };
  get(id?: string | RecordType | Array<string | RecordType>, owner: string | null = null) {
    let record: RecordType;

    if (!id) {
      record = new RecordImpl('', this);
    } else if (id instanceof RecordImpl) {
      record = id;
    } else if (isArray(id)) {
      const result = id.map(i => this.get(i));
      (result as any).load = (attributes: AttributesType, force?: boolean) => {
        return Promise.all(result.map(r => r.load(attributes, force)));
      };
      return result;
    } else if (isString(id)) {
      record = this._records[id];
      if (!record) {
        record = new RecordImpl(id, this);
        this._records[id] = record;
      }
    } else {
      record = new RecordImpl('', this);
    }

    if (owner) {
      if (!record._owners) {
        record._owners = {};
      }
      record._owners[owner] = true;
    }

    return record;
  }

  /**
   * Creates a virtual record. data can be an object or an array of objects.
   */
  create(data: any | any[], owner?: string): RecordType | RecordImpl[] {
    if (!owner) {
      throw new Error('Owner is mandatory for virtual records');
    }

    if (Array.isArray(data)) {
      const result: RecordImpl[] = [];
      for (const v of data) {
        const record = this.create(v, owner);
        if (record) {
          result.push(record as RecordImpl);
        }
      }
      return result;
    }

    const id = uuidV4();
    const record = new RecordImpl(id, this);
    record._virtual = true;
    record._owners[owner] = true;

    for (const att in data) {
      if (data.hasOwnProperty(att)) {
        const attKey = att === 'id' ? '_att_id' : att;
        record.persistedAtt(attKey, data[att]);
      }
    }

    this._records[id] = record;

    return record;
  }

  releaseAll(owner?: string): void {
    if (!owner) {
      return;
    }
    for (const recId in this._records) {
      if (this._records.hasOwnProperty(recId)) {
        const record = this._records[recId];
        if (record._owners && record._owners[owner] !== undefined) {
          this.release(recId, owner);
        }
      }
    }
  }

  release(id?: string | RecordImpl | Array<string | RecordImpl>, owner?: string): void {
    if (!id || !owner) {
      return;
    }

    let record: RecordType;
    if (id instanceof RecordImpl) {
      record = id;
    } else if (isArray(id)) {
      for (const rec of id) {
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

  forget(id?: string | RecordType | Array<string | RecordType>): void {
    if (isArray(id)) {
      for (const idElem of id) {
        this.forget(idElem);
      }
    } else {
      if (!isString(id) && isObject(id) && id.id) {
        id = id.id;
      }
      delete this._records[id as string];
    }
  }

  getRecordToEdit(id: string | RecordType): RecordType {
    const record = this.get(id);
    if (!record.isBaseRecord()) {
      return record;
    }
    const tmpId = id + '-alias-' + tmpRecordsCounter++;
    const result = new RecordImpl(tmpId, this, record);
    this._records[tmpId] = result;
    return result;
  }

  remove(records: string | RecordImpl | Array<string | RecordImpl>): Promise<void> {
    if (!Array.isArray(records)) {
      records = [records];
    }

    const ids = records.map(r => (r && isObject(r) ? r.id : r));
    return recordsDeleteFetch({ records: ids }).then(() => this.forget(ids));
  }

  queryOne(query: any, attributes?: AttributesType | null, defaultResult: any = null): Promise<any> {
    query = cloneDeep(query);

    const page = (query.page || {}) as any;
    page.maxItems = 1;

    query.page = page;

    return this.query(query, attributes as any).then((resp: any) => {
      if (resp.records.length === 0) {
        return defaultResult;
      }
      if (attributes && isString(attributes as any)) {
        return resp.records[0][attributes as any];
      }
      return resp.records[0];
    });
  }

  async query<T = any>(query: any, attributes?: AttributesType | null, options?: { debug?: boolean }): Promise<RecordsQueryResponse<T>> {
    if (query && query.attributes && arguments.length === 1) {
      attributes = query.attributes;
      query = query.query;
    }

    const attsToLoad: string[] = [];
    const attsAliases: string[] = [];

    prepareAttsToLoad(attributes, attsToLoad, attsAliases);

    const attsToLoadLengthWithoutClient = attsToLoad.length;

    let clientData: PreProcessAttsType = null;

    if (query && query.sourceId) {
      clientData = await recordsClientManager.preProcessAtts(query.sourceId, attsToLoad);
      if (clientData && (clientData as PreProcessAttsTypeNotNil).clientAtts) {
        prepareAttsToLoad((clientData as PreProcessAttsTypeNotNil).clientAtts, attsToLoad, attsAliases);
      }
    }

    const processRespRecords = async (respRecords: Array<any>): Promise<any[]> => {
      const records: any[] = [];
      for (const idx in respRecords) {
        if (!Object.prototype.hasOwnProperty.call(respRecords, idx)) {
          continue;
        }

        const recordAtts = respRecords[idx] as any;
        const loadedAtts: any[] = [];
        for (let idx = 0; idx < attsToLoad.length; idx++) {
          if (recordAtts.attributes) {
            loadedAtts.push(recordAtts.attributes[idx]);
          }
        }

        if (recordAtts.id) {
          const record = this.get(recordAtts.id) as any;
          for (let idx = 0; idx < attsToLoad.length; idx++) {
            record.persistedAtt(attsToLoad[idx], loadedAtts[idx]);
          }
        }

        if (clientData && attsToLoad.length) {
          const clientAtts: Record<string, any> = {};
          for (let i = attsToLoadLengthWithoutClient; i < attsToLoad.length; i++) {
            clientAtts[attsAliases[i]] = loadedAtts[i];
          }
          await recordsClientManager.postProcessAtts(loadedAtts, clientAtts, clientData);
        }

        const recordLoadedAtts: Record<string, any> = {};
        for (let idx = 0; idx < attsToLoadLengthWithoutClient; idx++) {
          recordLoadedAtts[attsAliases[idx]] = loadedAtts[idx];
        }

        if (attsToLoad.length) {
          if (!recordLoadedAtts.hasOwnProperty('id')) {
            recordLoadedAtts['id'] = recordAtts.id;
          }
          records.push(recordLoadedAtts);
        } else {
          records.push(recordAtts.id);
        }
      }

      return records;
    };

    const queryAttributes: Record<string, string> = {};
    for (let idx = 0; idx < attsToLoad.length; idx++) {
      queryAttributes[idx] = attsToLoad[idx];
    }

    const queryBody: any = {
      query: query,
      attributes: queryAttributes
    };

    if (options && options.debug) {
      queryBody.msgLevel = 'DEBUG';
    }

    const response = await recordsQueryFetch(queryBody);
    const { messages, hasMore, totalCount, records: _records } = response;
    const records = await processRespRecords(_records);

    return {
      records,
      messages,
      hasMore,
      totalCount,
      attributes: queryBody.attributes,
      errors: messages && messages.filter((msg: { level: string }) => msg && msg.level === 'ERROR')
    };
  }
}

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck = window.Citeck || {};
const Records: RecordsContainerType = window.Citeck.Records || new RecordsComponent();
window.Citeck.Records = Records;
window.Records = Records;

recordsClientManager.init(Records);

export default Records;
