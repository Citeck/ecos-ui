import CommandStack from 'diagram-js/lib/command/CommandStack';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

CommandStack.prototype.undo = function () {
  let action = this._getUndoAction(),
    next;

  if (action) {
    this._currentExecution.trigger = 'undo';

    this._pushAction(action);

    while (action) {
      this._internalUndo(action);
      next = this._getUndoAction();

      if (!next || next.id !== action.id) {
        if (action.command === 'element.updateLabel') {
          const newLabel = get(action, 'context.newLabel');
          const oldLabel = get(action, 'context.oldLabel');

          if (newLabel !== oldLabel && (Boolean(newLabel) || Boolean(oldLabel))) {
            break;
          }
        } else if (action.command === 'element.updateProperties') {
          const properties = get(action, 'context.properties', {});
          const oldProperties = get(action, 'context.oldProperties', {});
          const keys = Object.keys(properties);

          if (keys.includes((key) => !key.startsWith('ecos')) && !isEqual(properties, oldProperties)) {
            break;
          }
        } else {
          break;
        }
      }

      action = next;
    }

    this._popAction();
  }
};
