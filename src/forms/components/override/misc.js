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
 * @todo overrideFieldLogic fixes overrideTriggerChange - focus becomes good
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

/**
 * Overrides this.fieldLogic behaviour, declared in formiojs/components/base/Base.js
 * @override
 * @see Cause https://citeck.atlassian.net/browse/ECOSUI-1234
 */
export function overrideFieldLogic() {
  this.fieldLogic = data => {
    data = data || this.rootValue;

    const _this12 = this;
    const logics = this.logic;

    if (logics.length === 0) {
      return;
    }

    const newComponent = cloneDeep(this.component); //difference

    let changed = logics.reduce(function(changed, logic) {
      const result = checkTrigger(newComponent, logic.trigger, _this12.data, data, _this12.root ? _this12.root._form : {}, _this12);

      if (result) {
        changed |= _this12.applyActions(logic.actions, result, data, newComponent);
      }

      return changed;
    }, false);
    if (!isEqual(this.component, newComponent)) {
      this.component = newComponent;
      changed = true;
    }

    return changed;
  };
}
