import Records from './Records';

const getCurrentTime = () => new Date().getTime();
const ATT_TO_CHECK = '_modified';

export default class RecordUpdater {
  constructor(record, config = {}) {
    this._record = Records.get(record);
    this._config = config || {};
    this.init();
  }

  async init() {
    this._modified = await this._record.load(ATT_TO_CHECK);

    const minModifiedMsForUpdating = getCurrentTime() - 600000; //10 min
    if (!this._modified || Date.parse(this._modified) < minModifiedMsForUpdating) {
      return;
    }

    this._watcher = this._record.watch(ATT_TO_CHECK, () => {
      this.startChecking();
    });

    this._updatesCount = this._config.updatesCount || 10;
    this._periodMs = this._config.periodMs || 1000;
    this._initialDelayMs = this._config.initialDelayMs || 2000;

    this._repeater = new ActionRepeater({
      periodMs: this._config.periodMs,
      action: () => this.checkRecord()
    });
    this.startChecking();
  }

  checkRecord() {
    if (this.isDisposed()) {
      return;
    }
    let newModified = this._record.load(ATT_TO_CHECK, true);
    if (this._modified !== newModified) {
      this._modified = newModified;
      this._record.update();
    }
    return false;
  }

  dispose() {
    if (this.isDisposed()) {
      return;
    }
    this._repeater.cancel();
    this._watcher.unwatch();
    this._repeater = null;
  }

  isDisposed() {
    return this._repeater == null;
  }

  startChecking() {
    if (this.isDisposed()) {
      return;
    }
    setTimeout(() => {
      if (!this.isDisposed()) {
        this._repeater.setRepeatUntil(getCurrentTime() + this._updatesCount * this._periodMs);
      }
    }, this._initialDelayMs);
  }
}

class ActionRepeater {
  constructor({ periodMs, action }) {
    this._running = false;
    this._periodMs = periodMs;
    this._action = action;
  }

  setRepeatUntil(repeatUntilMs) {
    this._repeatUntilMs = repeatUntilMs;
    if (!this._running) {
      this._running = true;
      this.invokeAction();
    }
  }

  cancel() {
    this._running = false;
  }

  invokeAction() {
    if (!this._running) {
      return;
    }
    if (!this._action.apply(this) && getCurrentTime() < this._repeatUntilMs) {
      setTimeout(() => {
        this.invokeAction();
      }, this._periodMs);
    } else {
      this._running = false;
    }
  }
}
