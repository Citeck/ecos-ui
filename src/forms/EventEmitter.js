import { EventEmitter2 } from 'eventemitter2';
import { withSwitch, observeOverload } from 'formiojs/utils/utils';
import { t } from '../helpers/util';

export default class EventEmitter extends EventEmitter2 {
  constructor(conf = {}) {
    const { loadLimit = 50, eventsSafeInterval = 300, pause = 500, inspect = false, onOverload = () => {}, ...ee2conf } = conf;
    super(ee2conf);

    const [isPaused, togglePause] = withSwitch(false, true);

    const overloadHandler = () => {
      console.warn(t('ecos-form.event-overload'));
      onOverload();
      togglePause();
      setTimeout(togglePause, pause);
    };

    const dispatch = observeOverload(overloadHandler, {
      limit: loadLimit,
      delay: eventsSafeInterval
    });

    this.emit = (...args) => {
      if (typeof inspect === 'function') {
        inspect();
      }

      if (isPaused()) {
        return;
      }

      super.emit(...args);
      dispatch();
    };
  }
}
