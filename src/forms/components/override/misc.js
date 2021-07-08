import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import { checkTrigger } from 'formiojs/utils/utils';

const TRIGGER_CHANGE_DEBOUNCE_WAIT = 500;

/**
 * @override Base methods
 */

/**
 * Overrides this.triggerChange behaviour, declared in formiojs/components/base/Base.js
 */
export function overrideTriggerChange() {
  /**
   * Used to trigger a new change in this component.
   * @override
   * @type {function} - Call to trigger a change in this component.
   */
  let lastChanged = null;

  const _triggerChange = debounce((...args) => {
    if (this.root) {
      this.root.changing = false;
    }

    if (!args[1] && lastChanged) {
      // Set the changed component if one isn't provided.
      args[1] = lastChanged;
    }

    lastChanged = null;

    return this.onChange(...args);
  }, TRIGGER_CHANGE_DEBOUNCE_WAIT);

  this.triggerChange = (...args) => {
    if (args[1]) {
      // Make sure that during the debounce that we always track lastChanged component, even if they
      // don't provide one later.
      lastChanged = args[1];
    }

    if (this.root) {
      this.root.changing = true;
    }

    return _triggerChange(...args);
  };
}
