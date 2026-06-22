import isEqual from 'lodash/isEqual';

import { AttributesType, RecordWatcherLike } from './types';

export default class RecordWatcher implements RecordWatcherLike {
  private _record: any;
  private _watchedAttributes: AttributesType;
  private _callback?: (attributes: any) => void;
  private _attributes: any;
  private _initialized: boolean;

  constructor(record: any, watchedAttributes: AttributesType, callback?: (attributes: any) => void) {
    this._record = record;
    this._watchedAttributes = watchedAttributes;
    this._callback = callback;
    this._attributes = null;
    this._initialized = false;
  }

  getWatchedAttributes(): AttributesType {
    return this._watchedAttributes;
  }

  setAttributes(attributes: any): void {
    if (!isEqual(this._attributes, attributes)) {
      this._attributes = attributes;
      if (this._initialized) {
        this._callback?.(attributes);
      } else {
        this._initialized = true;
      }
    }
  }

  getAttributes(): any {
    return this._attributes;
  }

  unwatch(): void {
    this._record.unwatch(this);
  }

  callCallback(): void {
    this._callback?.(this._attributes);
  }
}
