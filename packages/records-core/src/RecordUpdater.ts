import Records from './Records';

const getCurrentTime = () => new Date().getTime();
const ATT_TO_CHECK = '_modified';
const ATT_MOVED_TO_REF = '_movedToRef?id';

interface RecordUpdaterConfig {
  updatesCount?: number;
  periodMs?: number;
  initialDelayMs?: number;
  onMovedToRef?: (ref: any) => void;
}

export default class RecordUpdater {
  private _record: any;
  private _config: RecordUpdaterConfig;
  private _modified: any;
  private _watcher: any;
  private _updatesCount = 10;
  private _periodMs = 1000;
  private _initialDelayMs = 2000;
  private _repeater: ActionRepeater | null = null;

  constructor(record: any, config: RecordUpdaterConfig = {}) {
    this._record = Records.get(record);
    this._config = config || {};
    this.init();
  }

  async init(): Promise<void> {
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
      periodMs: this._periodMs,
      action: () => this.checkRecord()
    });

    this.startChecking();
  }

  checkRecord(): boolean {
    if (this.isDisposed()) {
      return false;
    }

    const atts: Record<string, string> = { modified: ATT_TO_CHECK };

    if (this._config.onMovedToRef) {
      atts.movedToRef = ATT_MOVED_TO_REF;
    }

    this._record.load(atts, true).then((response: any) => {
      if (this.isDisposed()) {
        return;
      }

      const onMovedToRef = this._config.onMovedToRef;
      if (response.movedToRef && onMovedToRef) {
        onMovedToRef(response.movedToRef);
        return;
      }

      if (this._modified !== response.modified) {
        this._modified = response.modified;
        this._record.update();
      }
    });

    return false;
  }

  dispose(): void {
    if (!this._repeater) {
      return;
    }
    this._repeater.cancel();
    this._watcher.unwatch();
    this._repeater = null;
  }

  isDisposed(): boolean {
    return this._repeater == null;
  }

  startChecking(): void {
    if (this.isDisposed()) {
      return;
    }
    setTimeout(() => {
      if (this._repeater) {
        this._repeater.setRepeatUntil(getCurrentTime() + this._updatesCount * this._periodMs);
      }
    }, this._initialDelayMs);
  }
}

class ActionRepeater {
  private _running: boolean;
  private _periodMs: number;
  private _action: () => boolean;
  private _repeatUntilMs = 0;

  constructor({ periodMs, action }: { periodMs: number; action: () => boolean }) {
    this._running = false;
    this._periodMs = periodMs;
    this._action = action;
  }

  setRepeatUntil(repeatUntilMs: number): void {
    this._repeatUntilMs = repeatUntilMs;
    if (!this._running) {
      this._running = true;
      this.invokeAction();
    }
  }

  cancel(): void {
    this._running = false;
  }

  invokeAction(): void {
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
