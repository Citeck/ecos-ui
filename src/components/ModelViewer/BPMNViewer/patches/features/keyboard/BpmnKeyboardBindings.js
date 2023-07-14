import Keyboard from 'diagram-js/lib/features/keyboard/Keyboard';
import BpmnKeyboardBindings from 'bpmn-js/lib/features/keyboard/BpmnKeyboardBindings';

import { URL } from '../../../../../../constants';

Keyboard.prototype._keyHandler = function(event, type) {
  let eventBusResult;

  if (this._isEventIgnored(event)) {
    return;
  }

  const context = {
    keyEvent: event
  };

  const location = window.location.href;
  const isEditorPage = location.includes(URL.BPMN_EDITOR) || location.includes(URL.DMN_EDITOR);

  if (!isEditorPage) {
    return;
  }

  eventBusResult = this._eventBus.fire(type || 'keyboard.keydown', context);

  if (eventBusResult && isEditorPage) {
    event.preventDefault();
  }
};

export default BpmnKeyboardBindings;
