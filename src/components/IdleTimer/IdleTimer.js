import isFunction from 'lodash/isFunction';

class IdleTimer {
  #timer = null;
  #idleTime = 0;
  #checkInterval = 60000;
  #idleTimeOut = 60000 * 30;
  #idleCallback;
  #noIdleCallback;
  #resetIdleCallback;

  setCheckInterval = ms => {
    this.#checkInterval = ms;
    return this;
  };

  setIdleTimeout = ms => {
    this.#idleTimeOut = ms;
    return this;
  };

  setIdleCallback = callback => {
    this.#idleCallback = callback;
    return this;
  };

  setNoIdleCallback = callback => {
    this.#noIdleCallback = callback;
    return this;
  };

  setResetIdleCallback = callback => {
    this.#resetIdleCallback = callback;
    return this;
  };

  resetIdleTime = () => {
    this.#idleTime = 0;

    isFunction(this.#resetIdleCallback) && this.#resetIdleCallback();
  };

  run = () => {
    this.#timer = setInterval(() => {
      this.#idleTime += this.#checkInterval;

      if (this.#idleTime >= this.#idleTimeOut) {
        isFunction(this.#idleCallback) && this.#idleCallback();
      } else {
        isFunction(this.#noIdleCallback) && this.#noIdleCallback();
      }
    }, this.#checkInterval);

    window.addEventListener('mousemove', this.resetIdleTime);
    window.addEventListener('mousedown', this.resetIdleTime);
    window.addEventListener('click', this.resetIdleTime);
    window.addEventListener('wheel', this.resetIdleTime);
    window.addEventListener('keypress', this.resetIdleTime);

    return this;
  };

  stop = () => {
    window.removeEventListener('mousemove', this.resetIdleTime);
    window.removeEventListener('mousedown', this.resetIdleTime);
    window.removeEventListener('click', this.resetIdleTime);
    window.removeEventListener('wheel', this.resetIdleTime);
    window.removeEventListener('keypress', this.resetIdleTime);

    clearInterval(this.#timer);
    this.#timer = null;
    this.#idleTime = 0;

    return this;
  };
}

export default IdleTimer;
