class IdleTimer {
  _timer = null;
  _idleTime = 0;
  _checkInterval = 60000;
  _idleTimeOut = 60000 * 30;
  _idleCallback = null;
  _noIdleCallback = null;

  setCheckInterval = ms => {
    this._checkInterval = ms;
    return this;
  };

  setIdleTimeout = ms => {
    this._idleTimeOut = ms;
    return this;
  };

  setIdleCallback = callback => {
    this._idleCallback = callback;
    return this;
  };

  setNoIdleCallback = callback => {
    this._noIdleCallback = callback;
    return this;
  };

  resetIdleTime = () => {
    this._idleTime = 0;
  };

  run = () => {
    this._timer = setInterval(() => {
      this._idleTime += this._checkInterval;

      if (this._idleTime >= this._idleTimeOut) {
        typeof this._idleCallback === 'function' && this._idleCallback();
      } else {
        typeof this._noIdleCallback === 'function' && this._noIdleCallback();
      }
    }, this._checkInterval);

    window.addEventListener('mousemove', this.resetIdleTime);
    window.addEventListener('mousedown', this.resetIdleTime);
    window.addEventListener('click', this.resetIdleTime);
    window.addEventListener('wheel', this.resetIdleTime);
    window.addEventListener('keypress', this.resetIdleTime);
  };

  stop = () => {
    window.removeEventListener('mousemove', this.resetIdleTime);
    window.removeEventListener('mousedown', this.resetIdleTime);
    window.removeEventListener('click', this.resetIdleTime);
    window.removeEventListener('wheel', this.resetIdleTime);
    window.removeEventListener('keypress', this.resetIdleTime);

    clearInterval(this._timer);
  };
}

export default IdleTimer;
