export class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
  }
}
