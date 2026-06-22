import throttle from 'lodash/throttle';

class IdleTimer {
  #timer = null;
  #isIdle = false;
  #callbackRepeatTime = null;
  #idleTimeOut = 60 * 60 * 1000; // 1h
  #callback = () => {};

  #lastActive = new Date().getTime();
  #callbackRepeatCounter = 0;
  #lastStateChangedTime = this.#lastActive;

  setCallback(callback) {
    this.#callback = callback;
    return this;
  }

  setCallbackRepeatTime(repeatTime) {
    this.#callbackRepeatTime = repeatTime;
    return this;
  }

  setIdleTimeout = ms => {
    this.#idleTimeOut = ms;
    return this;
  };

  _updateActiveTime = throttle(() => {
    this.#lastActive = new Date().getTime();
    if (this.#isIdle) {
      this._setIdleState(false);
    }
  }, 3000);

  run = () => {
    this.#lastActive = new Date().getTime();

    this.#timer = setInterval(() => {
      const idleTime = new Date().getTime() - this.#lastActive;

      if (idleTime >= this.#idleTimeOut && !this.#isIdle) {
        this._setIdleState(true);
      }

      if (this.#callbackRepeatTime && this.#callbackRepeatTime > 0) {
        const currentStateTime = new Date().getTime() - this.#lastStateChangedTime;
        const newCallbackRepeatCounter = Math.floor(currentStateTime / this.#callbackRepeatTime);
        if (this.#callbackRepeatCounter < newCallbackRepeatCounter) {
          this.#callbackRepeatCounter = newCallbackRepeatCounter;
          this.#callback(this.#isIdle);
        }
      }
    }, 5000);

    window.addEventListener('mousemove', this._updateActiveTime);
    window.addEventListener('mousedown', this._updateActiveTime);
    window.addEventListener('click', this._updateActiveTime);
    window.addEventListener('wheel', this._updateActiveTime);
    window.addEventListener('keypress', this._updateActiveTime);

    return this;
  };

  _setIdleState(idle) {
    this.#lastStateChangedTime = new Date().getTime();
    this.#callbackRepeatCounter = 0;
    this.#isIdle = idle;
    this.#callback(idle);
  }

  stop = () => {
    window.removeEventListener('mousemove', this._updateActiveTime);
    window.removeEventListener('mousedown', this._updateActiveTime);
    window.removeEventListener('click', this._updateActiveTime);
    window.removeEventListener('wheel', this._updateActiveTime);
    window.removeEventListener('keypress', this._updateActiveTime);

    clearInterval(this.#timer);
    this.#timer = null;

    return this;
  };
}

export default IdleTimer;
