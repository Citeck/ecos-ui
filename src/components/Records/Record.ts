import { EventEmitter } from 'events';
import _ from 'lodash';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import Attribute from './Attribute';
import RecordWatcher from './RecordWatcher';
import { RecordsContainerType } from './Records';
import recordsClientManager from './client';
import { loadAttribute, recordsMutateFetch } from './recordsApi';
import {
  AttributeLike,
  AttributesType,
  ParseAttributeType,
  PreProcessAttsToLoadWithClientType,
  PreProcessAttsType,
  RecordWatcherLike,
  RequestRecordType,
  Scalar
} from './types';
import { mapValueToScalar, parseAttribute } from './utils/attStrUtils';
import { prepareAttsToLoad } from './utils/recordUtils';

import { SourcesId } from '@/constants';
import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces } from '@/helpers/util';

export const EVENT_CHANGE = 'change';

export type RecordType = RecordImpl;
type AttributeGetter = (this: AttributeLike, ...args: any[]) => any;
type AttributeSetter = (this: AttributeLike, ...args: any[]) => any;

export default class RecordImpl {
  protected _id: string;
  protected _attributes: Record<string, AttributeLike>;
  protected _recordFields: Record<string, any>;
  protected _recordFieldsToSave: Record<string, any>;
  protected _records: RecordsContainerType;
  protected _baseRecord: RecordType | null;
  protected _emitter: EventEmitter;
  protected _modified: string | null;
  protected _pendingUpdate: boolean;
  protected _updatePromise: Promise<any>;
  protected _watchers: RecordWatcherLike[];
  protected _mutClientData?: any;
  public _owners: Record<string, any>;
  public _virtual: boolean;

  constructor(id: string, records: RecordsContainerType, baseRecord?: RecordType | null) {
    this._id = id;
    this._attributes = {};
    this._recordFields = {};
    this._recordFieldsToSave = {};
    this._records = records;
    if (baseRecord) {
      this._baseRecord = baseRecord;
      this.att('_alias', id);
    } else {
      this._baseRecord = null;
    }
    this._emitter = new EventEmitter();
    this._modified = null;
    this._pendingUpdate = false;
    this._updatePromise = Promise.resolve();
    this._watchers = [];
    this._owners = {};
    this._virtual = false;
  }

  get id(): string {
    return this._id;
  }

  get events(): EventEmitter {
    return this._emitter;
  }

  isBaseRecord(): boolean {
    return !this._baseRecord;
  }

  isPendingUpdate(): boolean {
    return this._pendingUpdate;
  }

  getUpdatePromise(): Promise<any> {
    return this._updatePromise;
  }

  getBaseRecord(): RecordType {
    return this._baseRecord || this;
  }

  toJson(withDisplayNames?: boolean): { id: string; attributes: Record<string, any> } {
    const attributes: Record<string, any> = {};

    if (this._baseRecord) {
      const baseAtts = this._baseRecord._attributes;
      for (const att in baseAtts) {
        if (baseAtts.hasOwnProperty(att)) {
          attributes[att] = baseAtts[att].getValue();
        }
      }
    }

    const isPersistedAssocValue = (value: Scalar): boolean => {
      return _.isString(value) && value.includes('workspace://') && !value.includes('alias');
    };

    let recId = this.id;
    for (const att in this._attributes) {
      if (this._attributes.hasOwnProperty(att)) {
        if (att === '_att_id') {
          recId = this._attributes[att].getValue();
        } else {
          const value = this._attributes[att].getValue();
          if (value && withDisplayNames) {
            if (Array.isArray(value)) {
              let hasPromises = false;
              const mappedValues = value.map(it => {
                if (isPersistedAssocValue(it)) {
                  hasPromises = true;
                  return this._records.get(it).load('.disp');
                }
                return it;
              });
              attributes[att] = hasPromises ? Promise.all(mappedValues) : mappedValues;
            } else {
              if (isPersistedAssocValue(value)) {
                attributes[att] = this._records.get(value).load('.disp');
              } else {
                attributes[att] = value;
              }
            }
          } else {
            attributes[att] = value;
          }
        }
      }
    }

    for (const complexAtt in this._recordFieldsToSave) {
      if (!this._recordFieldsToSave.hasOwnProperty(complexAtt)) {
        continue;
      }

      const att = complexAtt.substring(complexAtt.indexOf('(n:"') + 4, complexAtt.indexOf('")'));

      if (att && !attributes[att]) {
        attributes[att] = this._recordFieldsToSave[complexAtt];
      }
    }

    return { id: recId, attributes };
  }

  async toJsonAsync(withDisplayNames?: boolean): Promise<{ id: string; attributes: Record<string, any> }> {
    await this._getWhenReadyToSave();

    const json = this.toJson(withDisplayNames);
    const keys = Object.keys(json.attributes);
    const promises = [];

    for (const key of keys) {
      const att = json.attributes[key];

      if (att && att.then) {
        const promise = att.then((res: Scalar) => (json.attributes[key] = res)).catch(() => (json.attributes[key] = null));

        promises.push(promise);
      }
    }

    if (promises.length === 0) {
      return json;
    } else {
      return Promise.all(promises)
        .then(() => json)
        .catch(() => json);
    }
  }

  isPersisted(): boolean {
    const atts = this._attributes;

    if (this._mutClientData && !recordsClientManager.isPersisted(this._mutClientData)) {
      return false;
    }

    for (const att in atts) {
      if (!atts.hasOwnProperty(att)) {
        continue;
      }
      if (att !== '_alias' && !atts[att].isPersisted()) {
        return false;
      }
    }
    return true;
  }

  _innerUpdate(resolve: (value?: unknown) => void, reject: () => void) {
    if (this.isVirtual()) {
      resolve();
      return Promise.resolve();
    }
    return this.load(
      {
        modified: '_modified?str',
        pendingUpdate: 'pendingUpdate?bool'
      },
      true
    ).then(({ modified, pendingUpdate }) => {
      if (pendingUpdate === true) {
        setTimeout(() => {
          this._innerUpdate(resolve, reject);
        }, 2000);
      } else {
        if (this._modified !== modified || this._checkWatchersToLoad()) {
          this._modified = modified;

          Promise.all(
            this._watchers.map(watcher => {
              return this.load(watcher.getWatchedAttributes(), true)
                .then(loadedAtts => {
                  return {
                    watcher,
                    loadedAtts
                  };
                })
                .catch(e => {
                  console.error(e);
                  return {
                    watcher,
                    loadedAtts: watcher.getAttributes()
                  };
                });
            })
          ).then(watchersData => {
            for (const data of watchersData) {
              try {
                data.watcher.setAttributes(data.loadedAtts);
              } catch (e) {
                console.error(e);
              }
            }
            resolve();
          });
        } else {
          resolve();
        }
      }
    });
  }

  /**
   * Проверка атрибутов на необходимость загрузки данных
   *
   * Условия:
   * - содержится точка в названии атрибута
   * - содержится префикс assoc_src_
   * @returns {boolean}
   * @private
   */
  _checkWatchersToLoad() {
    if (!this._watchers.length) {
      return false;
    }

    const checkConditions = (attr: string) => attr.includes('.') || attr.includes('assoc_src_');

    return this._watchers.some(watcher => {
      const attrs = watcher.getWatchedAttributes();

      if (Array.isArray(attrs)) {
        return attrs.some(checkConditions);
      }

      if (typeof attrs == 'string') {
        return checkConditions(attrs);
      }

      return false;
    });
  }

  update(): Promise<void> {
    if (this.isVirtual()) {
      return Promise.resolve();
    }

    this._pendingUpdate = true;

    let promise: Promise<void> | null = null;
    const cleanUpdateStatus = () => {
      if (this._updatePromise === promise) {
        this._pendingUpdate = false;
      }
    };

    promise = new Promise((resolve, reject) => {
      this._innerUpdate(resolve, reject);
    })
      .then(cleanUpdateStatus)
      .catch(e => {
        console.error(e);
        cleanUpdateStatus();
      });
    this._updatePromise = promise;
    return promise;
  }

  debounceUpdate = _.debounce(() => this.update(), 400);

  unwatch(watcher: RecordWatcherLike): void {
    for (let i = 0; i < this._watchers.length; i++) {
      if (this._watchers[i] === watcher) {
        this._watchers.splice(i, 1);
        break;
      }
    }
  }

  watch<T>(attributes: AttributesType, callback?: (atts: T) => void): RecordWatcherLike | undefined {
    if (this.isVirtual()) {
      return;
    }

    const watcher = new RecordWatcher(this, attributes, callback);
    const attsPromise = this.load(attributes);

    this._watchers.push(watcher);

    Promise.all([attsPromise, this.load('pendingUpdate?bool')])
      .then(([loadedAtts, pendingUpdate]) => {
        if (pendingUpdate) {
          this.debounceUpdate();
        }

        watcher.setAttributes(loadedAtts);
      })
      .catch(e => {
        console.error(e);

        attsPromise.then(atts => watcher.setAttributes(atts)).catch(console.error);
      });

    return watcher;
  }

  async _preProcessAttsToLoadWithClient(attributes: AttributesType): Promise<PreProcessAttsToLoadWithClientType> {
    const attsAliases: string[] = [];
    const attsToLoad: string[] = [];

    const isSingleAttribute = _.isString(attributes);
    prepareAttsToLoad(attributes, attsToLoad, attsAliases);

    const attsToLoadLengthWithoutClient = attsToLoad.length;

    let clientData: PreProcessAttsType = null;

    if (!this.isVirtual() && !this.isPendingCreate()) {
      const sourceIdDelimIdx = this.id.indexOf('@');
      let clientSourceId = null;
      if (sourceIdDelimIdx !== -1) {
        clientSourceId = this.id.substring(0, sourceIdDelimIdx);
      }
      clientData = await recordsClientManager.preProcessAtts(clientSourceId, attsToLoad);
      //@ts-ignore
      if (clientData && clientData.clientAtts) {
        //@ts-ignore
        prepareAttsToLoad(clientData.clientAtts, attsToLoad, attsAliases);
      }
    }

    return {
      attsAliases,
      attsToLoad,
      attsToLoadLengthWithoutClient,
      isSingleAttribute,
      clientData
    };
  }

  async _postProcessLoadedAttsWithClient(loadedAttsArr: Record<number, any>, attsLoadingCtx: PreProcessAttsToLoadWithClientType) {
    const { attsAliases, attsToLoad, attsToLoadLengthWithoutClient, isSingleAttribute, clientData } = attsLoadingCtx;

    if (clientData) {
      const clientAtts: Record<string, any> = {};
      for (let i = attsToLoadLengthWithoutClient; i < attsToLoad.length; i++) {
        clientAtts[attsAliases[i]] = loadedAttsArr[i];
      }
      const mutClientData = await recordsClientManager.postProcessAtts(loadedAttsArr, clientAtts, clientData);
      if (mutClientData) {
        this._mutClientData = mutClientData;
      }
    }

    if (isSingleAttribute) {
      return loadedAttsArr[0];
    }

    const attsResultMap: Record<string, any> = {};
    for (let i = 0; i < attsToLoadLengthWithoutClient; i++) {
      attsResultMap[attsAliases[i]] = loadedAttsArr[i];
    }

    return attsResultMap;
  }

  async load(attributes: AttributesType, force?: boolean): Promise<any> {
    const attsLoadingCtx = await this._preProcessAttsToLoadWithClient(attributes);
    const loadedAtts = await Promise.all(attsLoadingCtx.attsToLoad.map(att => this._loadAttWithCacheImpl(att, force)));
    return this._postProcessLoadedAttsWithClient(loadedAtts, attsLoadingCtx);
  }

  async _loadAttWithCacheImpl(att: string, force?: boolean) {
    const parsedAtt: ParseAttributeType = parseAttribute(att);
    if (parsedAtt != null) {
      let attribute = this._attributes[parsedAtt.name];
      if (!attribute) {
        attribute = new Attribute(this, parsedAtt.name);
        this._attributes[parsedAtt.name] = attribute;
      }
      return attribute.getValue(parsedAtt.scalar, parsedAtt.isMultiple, true, force);
    }

    let value = this._recordFieldsToSave[att];
    if (value === undefined) {
      value = this._recordFields[att];
    }
    if (!force && value !== undefined) {
      return value;
    } else {
      value = this._loadRecordAttImpl(att, force);
      if (value && value.then) {
        this._recordFields[att] = value
          .then((loaded: Scalar) => {
            this._recordFields[att] = loaded;
            return loaded;
          })
          .catch((e: string) => {
            console.error(e);
            this._recordFields[att] = null;
            return null;
          });
      } else {
        this._recordFields[att] = value;
      }
      return this._recordFields[att];
    }
  }

  _loadRecordAttImpl(attribute: string, force?: boolean) {
    if (this._baseRecord) {
      return this._baseRecord._loadAttWithCacheImpl(attribute, force);
    } else {
      return loadAttribute(this.id, attribute);
    }
  }

  loadAttribute(attribute: string) {
    return this.load(attribute);
  }

  loadEditorKey(attribute?: string) {
    if (!attribute) {
      return Promise.resolve(null);
    }
    return this.loadAttribute('#' + attribute + '?editorKey');
  }

  loadOptions(attribute?: string) {
    if (!attribute) {
      return Promise.resolve(null);
    }
    return this.loadAttribute('#' + attribute + '?options');
  }

  reset() {
    // if we reset virtual record,
    // then data will be lost and
    // we can't reload it from server
    if (!this.isVirtual()) {
      this._attributes = {};
      this._recordFields = {};
      this._recordFieldsToSave = {};
    }
  }

  getRawAttributes() {
    const attributes: Record<string, AttributeLike> = {};

    for (const attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }
      const attribute = this._attributes[attName];
      attributes[attName] = attribute.getValue();
    }

    return attributes;
  }

  getAttributesToSave(): Record<string, AttributeLike> {
    const attributesToSave: Record<string, AttributeLike> = {};

    for (const att in this._recordFieldsToSave) {
      if (this._recordFieldsToSave.hasOwnProperty(att)) {
        attributesToSave[att] = this._recordFieldsToSave[att];
      }
    }

    for (const attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }

      const attribute = this._attributes[attName];

      if (!attribute.isPersisted()) {
        attributesToSave[attribute.getNewValueAttName()] = attribute.getValue();
      }
    }

    if (attributesToSave && getEnabledWorkspaces() && !attributesToSave['_workspace'] && !attributesToSave['_workspace?str']) {
      attributesToSave['_workspace'] = getWorkspaceId();
    }

    return attributesToSave;
  }

  async _getChildAssocAttributes(): Promise<string[]> {
    const attributes = [];
    for (const attName in this._attributes) {
      // _ECM_ - prefix for attributes mirrored from document to task
      if (!this._attributes.hasOwnProperty(attName) || !attName || (attName[0] === '_' && !attName.startsWith('_ECM_'))) {
        continue;
      }
      const attribute = this._attributes[attName];
      if (attribute.getNewValueInnerAtt() === 'assoc') {
        attributes.push(attName);
      }
    }
    const typeId = await this.getTypeId();
    if (!typeId) {
      return attributes;
    }
    const modelAtts = await this._records
      .get(SourcesId.RESOLVED_TYPE + '@' + typeId)
      .load('model.attributes[]{id,type,isChild:config.child?bool}');
    if (modelAtts) {
      for (const attDef of modelAtts) {
        if (attDef.type === 'ASSOC' && attDef.isChild === true && attributes.indexOf(attDef.id) === -1) {
          attributes.push(attDef.id);
        }
      }
    }
    return attributes;
  }

  async _getLinkedRecordsToSave(): Promise<RecordType[]> {
    const assocAtts = await this._getChildAssocAttributes();
    const result = assocAtts.reduce<Promise<RecordType>[]>((acc, att) => {
      let value = this.att(att);
      if (!value) {
        return acc;
      }
      value = Array.isArray(value) ? value : [value];
      return acc.concat(value.map(id => this._records.get(id)).map(rec => rec._getWhenReadyToSave()));
    }, []);

    const linkedRecords: RecordType[] = await Promise.all(result).then(records => records.filter(r => !r.isPersisted()));
    const nestedLinkedRecords = await Promise.all(linkedRecords.map(async r => await r._getLinkedRecordsToSave()));
    const nestedLinkedRecordsFlatten = nestedLinkedRecords.reduce((acc, val) => acc.concat(val), []);
    return [...linkedRecords, ...nestedLinkedRecordsFlatten];
  }

  async _saveWithAtts(attributes: AttributesType) {
    const loadAttsCtx = await this._preProcessAttsToLoadWithClient(attributes);
    if (this.isVirtual()) {
      return this._postProcessLoadedAttsWithClient(
        loadAttsCtx.attsToLoad.map(() => null),
        loadAttsCtx
      );
    }

    const recordsToSave = await this._getWhenReadyToSave().then(baseRecordToSave => {
      return this._getLinkedRecordsToSave().then(linkedRecords => [baseRecordToSave, ...linkedRecords]);
    });
    const requestRecords = [];

    for (const record of recordsToSave) {
      const attributesToSave = record.getAttributesToSave();

      if (record._mutClientData) {
        await recordsClientManager.prepareMutation(attributesToSave, record._mutClientData);
      }

      if (!_.isEmpty(attributesToSave)) {
        const baseId = record.getBaseRecord().id;
        requestRecords.push({
          id: baseId,
          attributes: attributesToSave
        });
      }
    }

    const requestAttributes: Record<number, string> = {};
    for (let idx = 0; idx < loadAttsCtx.attsToLoad.length; idx++) {
      requestAttributes[idx] = loadAttsCtx.attsToLoad[idx];
    }

    const mutResponse = await recordsMutateFetch({
      records: requestRecords,
      attributes: requestAttributes
    });

    for (const record of requestRecords) {
      this._records.get(record.id).reset();
    }
    const loadedAtts: Record<string, any> = [];
    const respMainRecordData = _.get(mutResponse, 'records[0]', {});
    if (respMainRecordData.id && respMainRecordData.attributes) {
      const respMainRecord = this._records.get(respMainRecordData.id);
      for (const attIdx in respMainRecordData.attributes) {
        const loadedValue = respMainRecordData.attributes[attIdx];
        loadedAtts[attIdx] = loadedValue;
        const att = get(loadAttsCtx.attsToLoad, [attIdx]);
        if (att) {
          respMainRecord.persistedAtt(att, loadedValue);
        }
      }
    }

    const resAtts = await this._postProcessLoadedAttsWithClient(loadedAtts, loadAttsCtx);

    for (let idx = requestRecords.length - 1; idx >= 0; idx--) {
      const recordData = requestRecords[idx];
      const record = this._records.get(recordData.id);
      record.events.emit(EVENT_CHANGE);
      record.update();
    }

    return resAtts;
  }

  /**
   * Send to server in-memory changes made by method att(name, value)
   * @param attsToLoad attributes to load from result after mutation.
   * @returns {Promise<*|{}|*[]>}
   */
  async save(attsToLoad?: AttributesType) {
    if (attsToLoad) {
      return this._saveWithAtts(attsToLoad);
    }
    if (this.isVirtual()) {
      return;
    }

    const requestRecords: RequestRecordType[] = [];

    const recordsToSavePromises = this._getWhenReadyToSave().then(baseRecordToSave => {
      return this._getLinkedRecordsToSave().then(linkedRecords => [baseRecordToSave, ...linkedRecords]);
    });

    const nonBaseRecordsToReset: string[] = [];

    return recordsToSavePromises.then(async recordsToSave => {
      for (const record of recordsToSave) {
        const attributesToSave = record.getAttributesToSave();

        if (record._mutClientData) {
          await recordsClientManager.prepareMutation(attributesToSave, record._mutClientData);
        }

        if (!_.isEmpty(attributesToSave)) {
          const baseId = record.getBaseRecord().id;
          if (baseId !== record.id) {
            nonBaseRecordsToReset.push(record.id);
          }
          requestRecords.push({
            id: baseId,
            attributes: attributesToSave
          });
        }
      }

      if (!requestRecords.length) {
        return Promise.resolve(this);
      }

      return recordsMutateFetch({ records: requestRecords }).then(response => {
        const attributesToLoad: Record<string, any> = {};

        for (const record of requestRecords) {
          const recAtts: Record<string, any> = attributesToLoad[record.id] || {};

          for (const att in record.attributes) {
            if (record.attributes.hasOwnProperty(att)) {
              recAtts[att] = att;
            }
          }

          attributesToLoad[record.id] = recAtts;
        }

        const loadPromises = [];
        for (const recordId in attributesToLoad) {
          if (attributesToLoad.hasOwnProperty(recordId)) {
            const record = this._records.get(recordId);
            record.reset();
            const promise = record.load(attributesToLoad[recordId], true);
            if (promise && isFunction(promise.then)) {
              loadPromises.push(promise);
            }
          }
        }

        for (const nonBaseRecordId of nonBaseRecordsToReset) {
          this._records.get(nonBaseRecordId).reset();
        }

        return Promise.all(loadPromises).then(() => {
          for (const recordId of Object.keys(attributesToLoad)) {
            const record = this._records.get(recordId);
            record.events.emit(EVENT_CHANGE);
            record.update();
          }
          const resultId = ((response.records || [])[0] || {}).id;
          return resultId ? this._records.get(resultId) : this;
        });
      });
    });
  }

  _getWhenReadyToSave(): Promise<RecordType> {
    return new Promise((resolve, reject) => {
      const resolveWithNode = () => resolve(this);
      this._waitUntilReadyToSave(0, resolveWithNode, reject);
    });
  }

  _waitUntilReadyToSave(tryCounter: number, resolve: (value?: unknown) => void, reject: (err?: string) => void) {
    const notReadyAtts = [];
    for (const attName in this._attributes) {
      if (!this._attributes.hasOwnProperty(attName)) {
        continue;
      }
      const att = this._attributes[attName];
      if (!att.isReadyToSave()) {
        notReadyAtts.push(attName);
      }
    }
    for (const attName in this._recordFieldsToSave) {
      if (!this._recordFieldsToSave.hasOwnProperty(attName)) {
        continue;
      }
      const value = this._recordFieldsToSave[attName];
      if (value && value.then) {
        notReadyAtts.push(attName);
      }
    }

    if (notReadyAtts.length > 0) {
      if (tryCounter > 100) {
        console.error('Not ready attributes:', notReadyAtts);
        reject('Record _waitUntilReadyToSave aborted');
      } else {
        setTimeout(() => this._waitUntilReadyToSave(tryCounter + 1, resolve, reject), 100);
      }
    } else {
      resolve();
    }
  }

  persistedAtt(name: string, value: Scalar) {
    return this._processAttField(
      name,
      value,
      arguments.length === 1,
      Attribute.prototype.getPersistedValue,
      Attribute.prototype.setPersistedValue,
      false
    );
  }

  att(name: string, value?: Scalar): string | string[] {
    return this._processAttField(name, value, arguments.length === 1, Attribute.prototype.getValue, Attribute.prototype.setValue, true);
  }

  removeAtt(name: string) {
    const parsedAtt = parseAttribute(name);
    const key = (parsedAtt ? parsedAtt.name : null) || name;
    delete this._attributes[key];
  }

  isVirtual(): boolean {
    if (this._virtual) {
      return true;
    }
    const baseRecord = this.getBaseRecord();
    return baseRecord.id !== this.id && baseRecord.isVirtual();
  }

  isPendingCreate() {
    const baseRecordId = this.getBaseRecord().id;

    if (baseRecordId.startsWith('dict@')) {
      return true;
    }

    // base record with '@' at the end mean that record is not exists yet and will be created on save
    return baseRecordId.indexOf('@') === baseRecordId.length - 1;
  }

  _processAttField(name: string, value: Scalar, isRead: boolean, getter: AttributeGetter, setter: AttributeSetter, toSave: boolean) {
    if (!name) {
      return null;
    }

    const parsedAtt = parseAttribute(name, mapValueToScalar(value));
    if (parsedAtt === null) {
      if (isRead) {
        let attValue = this._recordFieldsToSave[name];
        if (attValue === undefined) {
          attValue = this._recordFields[name];
        }
        if (attValue !== undefined) {
          return attValue;
        }
      } else {
        if (toSave) {
          const currentValue = this._recordFields[name];
          if (currentValue === undefined) {
            this._recordFieldsToSave[name] = this.load(name, true)
              .then(loadedValue => {
                if (!_.isEqual(loadedValue, value)) {
                  this._recordFieldsToSave[name] = value;
                  return value;
                } else {
                  delete this._recordFieldsToSave[name];
                  return null;
                }
              })
              .catch(e => {
                console.error(e);
                delete this._recordFieldsToSave[name];
                return null;
              });
          } else if (!_.isEqual(currentValue, value)) {
            this._recordFieldsToSave[name] = value;
          }
        } else {
          this._recordFields[name] = value;
        }
      }
      return null;
    } else {
      let att = this._attributes[parsedAtt.name];
      if (!att) {
        if (isRead) {
          if (this._baseRecord) {
            att = this._baseRecord._attributes[parsedAtt.name];
          }
          if (!att) {
            return parsedAtt.isMultiple ? [] : null;
          }
        } else {
          att = new Attribute(this, parsedAtt.name);
          this._attributes[parsedAtt.name] = att;
        }
      }

      if (isRead) {
        let scalar = parsedAtt.scalar;
        if (value === undefined && name.indexOf('?') === -1 && name[0] !== '.') {
          scalar = null;
        }
        return getter.call(att, scalar, parsedAtt.isMultiple, false);
      } else {
        if (att) {
          return setter.call(att, parsedAtt.scalar, value);
        } else {
          console.warn("Attribute can't be changed: '" + name + "'");
        }
      }
    }
  }

  forceUpdate() {
    this._watchers.forEach(watcher => {
      watcher.callCallback();
    });
  }

  async getTypeId() {
    const typeAtt = this._attributes['_type'];
    if (typeAtt == null) {
      return this.load('_type?id').then(typeRef => {
        return this.__getTypeIdFromRef(typeRef);
      });
    }
    return this.__getTypeIdFromRef(await typeAtt.getValue('id', false, true, false));
  }

  __getTypeIdFromRef(ref: string) {
    if (!_.isString(ref) || ref === '') {
      return '';
    }
    const localIdDelimIdx = ref.indexOf('@');
    if (localIdDelimIdx === -1 || localIdDelimIdx === ref.length - 1) {
      return ref;
    }
    return ref.substring(localIdDelimIdx + 1);
  }
}
