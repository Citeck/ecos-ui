import { isPaste } from 'diagram-js/lib/features/keyboard/KeyboardUtil';

import { createReviver } from '../utils';

export const handleCopyElement = event => {
  const { tree } = event;

  localStorage.setItem('bpmnClipboard', JSON.stringify(tree));
};

export default {
  __init__: ['nativeCopyPaste'],
  nativeCopyPaste: [
    'type',
    function(keyboard, eventBus, moddle, clipboard) {
      eventBus.on('copyPaste.elementsCopied', handleCopyElement);

      keyboard.addListener(2000, event => {
        const { keyEvent } = event;

        if (!isPaste(keyEvent)) {
          return;
        }

        const serializedCopy = localStorage.getItem('bpmnClipboard');

        if (!serializedCopy) {
          return;
        }

        const parsedCopy = JSON.parse(serializedCopy, createReviver(moddle));

        clipboard.set(parsedCopy);
      });
    }
  ]
};
