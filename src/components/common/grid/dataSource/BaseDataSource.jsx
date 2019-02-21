export default class BaseDataSource {
  constructor(options) {
    options = options || {};
    const defaultOptions = this._getDefaultOptions();
    this.options = this._merge(defaultOptions, options);
  }

  _getDefaultOptions() {
    return {};
  }

  _merge(target, source) {
    for (let key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) Object.assign(source[key], this._merge(target[key], source[key]));
    }

    Object.assign(target || {}, source);
    return target;
  }
}
