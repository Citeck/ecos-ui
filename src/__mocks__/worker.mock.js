export default class WorkerMock {
  constructor() {
    this.onmessage = null;
    this._listeners = {};
  }
  postMessage(msg) {}
  addEventListener(name, fn) {
    this._listeners[name] = fn;
  }
  removeEventListener(name) {
    delete this._listeners[name];
  }
  terminate() {}
}
