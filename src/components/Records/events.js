import { EventEmitter2 } from 'eventemitter2';

export const EventTypes = {
  CHANGE: 'change'
};

export default class EventService {
  #emitter = null;

  constructor() {
    this.#emitter = new EventEmitter2();
  }

  get emitter() {
    return this.#emitter;
  }

  notifyRecordChanges() {
    this.#emitter.emit(EventTypes.CHANGE);
  }

  /**
   * emitter Version Changes
   * @param record
   */

  notifyVersionChanges(record) {
    this.#emitter.emit(EventTypes.VERSION_CHANGED, record);
  }

  observeVersionChanges(func) {
    this.#emitter.on(EventTypes.VERSION_CHANGED, func);
  }

  offVersionChanges(func) {
    this.#emitter.off(EventTypes.VERSION_CHANGED, func);
  }
}
