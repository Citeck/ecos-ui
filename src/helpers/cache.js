export default class Cache {
  #map = new Map();
  #suffix = '';

  constructor(suffix) {
    if (suffix) {
      this.#suffix = suffix;
    }
  }

  get = key => {
    return this.#map.get(key + this.#suffix);
  };

  set = (key, id) => {
    this.#map.set(key + this.#suffix, id);
  };

  check = key => {
    return this.#map.has(key + this.#suffix);
  };
}
