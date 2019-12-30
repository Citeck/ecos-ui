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

  notifyTaskChanged(record) {
    this.#emitter.emit(EventTypes.TASK_CHANGED, record);
  }

  observeTaskChanged(func) {
    this.#emitter.on(EventTypes.TASK_CHANGED, func);
  }

  offTaskChanged(func) {
    this.#emitter.off(EventTypes.TASK_CHANGED, func);
  }
}
