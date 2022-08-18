import JSONPretty from 'react-json-pretty';
import React from 'react';

import DialogManager from '../components/common/dialogs/Manager';

export function showModalJson(data, title = 'Configuration') {
  DialogManager.showCustomDialog({
    title,
    modalClass: 'ecos-modal_width-lg',
    body: (
      <div style={{ overflow: 'auto', maxHeight: '85vh' }}>
        <JSONPretty data={data} />
      </div>
    )
  });
}

/**
 * @param postfix {string}
 * @param prefix {string|undefined}
 * @returns {string}
 */
export function getFitnesseClassName(postfix, prefix) {
  if (!prefix) {
    return getFitnesseInlineToolsClassName(postfix);
  }

  return `fitnesse-${prefix}__${postfix}`.toLowerCase();
}

export function getFitnesseInlineToolsClassName(actionId) {
  const classNames = [`fitnesse-inline-tools-actions-btn__${actionId}`];

  if (actionId === 'view') {
    classNames.push('fitnesse-inline-tools-actions-btn__on');
  }

  return classNames.join(' ');
}
