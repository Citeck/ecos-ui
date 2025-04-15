import classNames from 'classnames';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';
import React from 'react';
import JSONPretty from 'react-json-pretty';

import { t } from './util';

import DialogManager from '@/components/common/dialogs/Manager';

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

export const showWarningMessage = debounce(
  ({ warningMessage, closeWarningMessage, actionCallback, actionLabel, onHide, className = '', buttons: otherButtons }) => {
    const buttons = [];

    if (closeWarningMessage) {
      buttons.push({
        key: 'close',
        onClick: closeWarningMessage,
        label: t('button.close-modal')
      });
    }

    if (isFunction(actionCallback) && actionLabel) {
      buttons.push({
        className: 'ecos-btn_blue',
        key: 'action',
        onClick: actionCallback,
        label: actionLabel
      });
    }

    if (otherButtons && otherButtons.length) {
      otherButtons.forEach(button => button && button.key && button.onClick && button.label && buttons.push({ ...button }));
    }

    DialogManager.showCustomDialog({
      onHide,
      isVisible: !!warningMessage,
      title: t('warning'),
      body: warningMessage,
      modalClass: classNames('ecos-modal_width-xs ecos-modal_level-4', className),
      buttons
    });
  },
  0
);

/**
 * @param args
 * @returns {string}
 */
export function getFitnesseClassName(...args) {
  args = args.filter(item => !!item);

  const postfix = args.pop();
  const parts = [args.join('-'), postfix].filter(item => !!item);

  return `fitnesse-${parts.join('__')}`.toLowerCase();
}

export function getFitnesseInlineToolsClassName(actionId) {
  const classNames = [`fitnesse-inline-tools-actions-btn__${actionId}`];

  if (actionId === 'view') {
    classNames.push('fitnesse-inline-tools-actions-btn__on');
  }

  return classNames.join(' ');
}
