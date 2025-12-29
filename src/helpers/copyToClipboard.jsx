import ClipboardJS from 'clipboard';
import React from 'react';
import { Alert } from 'reactstrap';

import { t } from './export/util';
import { prepareReactKey } from './util';

const Labels = {
  MODAL_TITLE: 'copy-to-clipboard.modal.title',
  MODAL_DESCRIPTION: 'copy-to-clipboard.modal.description',
  MODAL_BTN_COPY: 'copy-to-clipboard.btn.copy'
};

/**
 * Class with static methods for copying text to the clipboard.
 * Both standard copy methods and workarounds for legacy
 * and specific browsers are used.
 */
export default class CopyToClipboard {
  /**
   * @param text
   * @returns {boolean|undefined}
   */
  static copy = text => {
    const copied = CopyToClipboard.modernCopying(text);

    if (copied) {
      return true;
    }

    CopyToClipboard.showManualCopyModal(text);
  };

  static modernCopying = text => {
    if (window.clipboardData && window.clipboardData.setData) {
      return window.clipboardData.setData('Text', text);
    }

    if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
      const textarea = document.createElement('textarea');

      textarea.textContent = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        return document.execCommand('copy');
      } catch (error) {
        console.error('Copy to clipboard failed.', error);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }

    return false;
  };

  static showManualCopyModal = text => {
    const id = prepareReactKey();
    let clipboard;

    window.Citeck.Dialogs.showCustomDialog({
      title: Labels.MODAL_TITLE,
      buttons: [
        {
          id,
          label: Labels.MODAL_BTN_COPY,
          onMouseDown: () => {
            clipboard = new ClipboardJS(`#${id}`);
          },
          onClick: () => {
            clipboard.destroy();
          },
          'data-clipboard-text': text
        }
      ],
      buttonsClassName: 'd-flex justify-content-center',
      reactstrapProps: {
        backdrop: false,
        size: 'md'
      },
      body: CopyToClipboard.modalBody({ text })
    });
  };

  static modalBody = props => {
    return (
      <>
        <Alert color="info">{t(Labels.MODAL_DESCRIPTION)}</Alert>
        <small color="text-muted">{props.text}</small>
      </>
    );
  };
}
