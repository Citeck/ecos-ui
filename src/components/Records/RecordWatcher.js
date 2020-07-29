import isEqual from 'lodash/isEqual';

export default class RecordWatcher {
  constructor(record, watchedAttributes, callback) {
    this._record = record;
    this._watchedAttributes = watchedAttributes;
    this._callback = callback;
    this._attributes = null;
    this._initialized = false;
  }

  getWatchedAttributes() {
    return this._watchedAttributes;
  }

  setAttributes(attributes) {
    if (!isEqual(this._attributes, attributes)) {
      this._attributes = attributes;
      if (this._initialized) {
        this._callback(attributes);
      } else {
        this._initialized = true;
      }
    }
  }

  getAttributes() {
    return this._attributes;
  }

  unwatch() {
    this._record.unwatch(this);
  }

  callCallback() {
    this._callback(this._attributes);
  }
}
