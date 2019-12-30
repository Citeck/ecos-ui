import { EventEmitter2 } from 'eventemitter2';

export const EventTypes = {
  CHANGE: 'change',
  TASK_CHANGED: 'task-changed',
  VERSION_CHANGED: 'version-changed'
};

export default class EventService {
  #emitter = null;

  constructor() {
    this.#emitter = new EventEmitter2();
  }

  get emitter() {
    return this.#emitter;
  }

  notifyTaskChanges(record) {
    this.#emitter.emit(EventTypes.TASK_CHANGED, record);
  }

  observeTaskChanges(func) {
    this.#emitter.on(EventTypes.TASK_CHANGED, func);
  }

  offTaskChanges(func) {
    this.#emitter.off(EventTypes.TASK_CHANGED, func);
  }
}
