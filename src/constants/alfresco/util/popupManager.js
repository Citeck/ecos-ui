import classNames from 'classnames';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { Btn } from '../../../components/common/btns';
import { TunableDialog } from '../../../components/common/dialogs';
import { Input } from '../../../components/common/form';
import { t } from '../../../helpers/util';

class Popup {
  #container = null;
  #initialized = false;
  #destroyed = false;
  #root = false;

  get initialized() {
    return this.#initialized;
  }

  get destroyed() {
    return this.#destroyed;
  }

  create = (props = {}, wrapper = document.body) => {
    this.#container = document.createElement('div');

    this.render({
      ...props,
      noHeader: !props.title,
      onClose: this.onClose
    });

    wrapper.appendChild(this.#container);
    this.#initialized = true;
  };

  onClose = () => {
    if (!this.#container) {
      return;
    }

    this.close();
  };

  close = callback => {
    this.render({ isOpen: false }, () => {
      if (typeof callback === 'function') {
        callback();
      }
      this.destroy();
    });
  };

  destroy = () => {
    if (this.#container) {
      this.#root?.unmount();
      this.#container.remove();
      this.#container = null;
    }

    this.#destroyed = true;
  };

  render = (props = {}, callback = () => null) => {
    this.#root = createRoot(this.#container);
    this.#root.render(React.createElement(TunableDialog, props, callback));
  };
}

class PopupManager {
  #modal = null;
  #inputValue = '';

  get defaultDisplayMessageConfig() {
    return {
      title: null,
      text: null,
      spanClass: 'message',
      visible: false,
      noEscape: false
    };
  }

  get defaultDisplayPromptConfig() {
    return {
      title: null,
      text: null,
      icon: null,
      close: false,
      constraintoviewport: true,
      draggable: true,
      effect: null,
      effectDuration: 0.5,
      modal: true,
      visible: false,
      noEscape: false,
      buttons: [
        {
          text: null,
          handler: () => this.destroy(),
          isDefault: true
        }
      ]
    };
  }

  get defaultGetUserInputConfig() {
    return {
      title: null,
      text: null,
      input: 'textarea',
      value: '',
      icon: null,
      close: true,
      constraintoviewport: true,
      draggable: true,
      effect: null,
      effectDuration: 0.5,
      modal: true,
      visible: false,
      initialShow: true,
      noEscape: true,
      html: null,
      callback: null,
      buttons: [
        {
          text: null,
          handler: null,
          isDefault: true
        },
        {
          text: null,
          handler: () => this.destroy()
        }
      ]
    };
  }

  createModal(props, container = document.body) {
    if (this.#modal && this.#modal.initialized && !this.#modal.destroyed) {
      this.#modal.close();
      this.#modal = null;
    }

    this.#modal = new Popup();
    this.#modal.create(props, container);
  }

  destroy() {
    if (this.#modal && !this.#modal.destroyed) {
      this.#modal.close();
      this.#modal = null;
    }
  }

  displayMessage(props = {}, container = document.body) {
    const { text } = props;

    if (text === undefined || typeof text !== 'string') {
      throw new Error('Property text in userConfig must be set');
    }

    const content = text
      .trim()
      .split(/\r\n|\r|\n/g)
      .map((item, i) => <div key={i}>{item}</div>);

    this.createModal(
      {
        content,
        isOpen: true,
        noHeader: true,
        className: 'ecos-modal_center'
      },
      container
    );
  }

  displayPrompt(props = {}, container = document.body) {
    const { buttons = [], text = '', title = '' } = props;

    this.createModal(
      {
        title,
        isOpen: true,
        content: text,
        footer: buttons.map(this.renderButton)
      },
      container
    );
  }

  renderInput(props = {}) {
    switch (props.input) {
      case 'text': {
        return (
          <Input
            autoFocus
            type="text"
            defaultValue=""
            className="mt-2"
            onChange={event => (this.#inputValue = event.target.value)}
            placeholder={t('Enter text')}
          />
        );
      }
      default:
        return null;
    }
  }

  renderButton = (button = {}) => {
    const { text = '', isDefault, handler = () => null } = button;

    return (
      <Btn
        key={text}
        className={classNames({
          'ecos-btn_blue': !isDefault,
          'ecos-btn_hover_light-blue': !isDefault
        })}
        onClick={handler.bind(this)}
      >
        {t(text)}
      </Btn>
    );
  };

  getUserInput(props = {}) {
    const { okButtonText = 'Ok', title = '', text = '', callback: { fn = () => null } = {}, buttons = [] } = props;
    let footer = buttons.length
      ? buttons.map(this.renderButton)
      : [
          <Btn
            key={okButtonText}
            className={'ecos-btn_blue ecos-btn_hover_light-blue'}
            onClick={() => {
              this.#modal.close(() => {
                fn.call(this, this.#inputValue);
              });
            }}
          >
            {t(okButtonText)}
          </Btn>,
          <Btn key="cancel" onClick={this.destroy.bind(this)}>
            {t('btn.cancel.label')}
          </Btn>
        ];

    this.createModal({
      title,
      isOpen: true,
      content: (
        <>
          {text}
          {this.renderInput(props)}
        </>
      ),
      footer
    });
  }

  msg = text => t(text);
}

const popupManager = new PopupManager();

export { PopupManager, Popup };
export default popupManager;
