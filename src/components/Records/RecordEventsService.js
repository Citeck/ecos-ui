import { EventEmitter2 } from 'eventemitter2';

export const EventTypes = {
  CHANGE: 'change'
};

export default class RecordEventsService {
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
}
