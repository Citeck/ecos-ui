import isEqual from 'lodash/isEqual';

export default class RecordWatcher {
  constructor(record, watchedAttributes, callback) {
    this._record = record;
    this._watchedAttributes = watchedAttributes;
    this._callback = callback;
    this._attributes = null;
  }

  getWatchedAttributes() {
    return this._watchedAttributes;
  }

  setAttributes(attributes) {
    if (!isEqual(this._attributes, attributes)) {
      this._attributes = attributes;
      this._callback(attributes);
    }
  }

  getAttributes() {
    return this._attributes;
  }

  unwatch() {
    this._record.unwatch(this);
  }
}
