import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { NotificationManager } from 'react-notifications';

import { TunableDialog } from '../../../components/common/dialogs';
import { t } from '../../../helpers/util';
import { Btn } from '../../../components/common/btns';
import { Input } from '../../../components/common/form';

class Popup {
  #container = null;
  #initialized = false;
  #destroyed = false;

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
      ReactDOM.unmountComponentAtNode(this.#container);
      this.#container.remove();
      this.#container = null;
    }

    this.#destroyed = true;
  };

  render = (props = {}, callback = () => null) => {
    ReactDOM.render(React.createElement(TunableDialog, props), this.#container, callback);
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
          handler: () => {
            this.destroy();
          },
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
          handler: () => {
            this.destroy();
          }
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
    if (props.text === undefined) {
      throw new Error('Property text in userConfig must be set');
    }

    let messages = props.text.trim().split(/\r\n|\r|\n/g);

    if (messages.length > 5) {
      this.createModal(
        {
          isOpen: true,
          noHeader: true,
          content: messages.map((item, i) => <div key={i}>{item}</div>),
          className: 'ecos-modal_center'
        },
        container
      );
    } else {
      messages.map((item, i) => NotificationManager.info('', t(item), 3000 + i * 1000));
      this.destroy();
    }
  }

  displayPrompt(props = {}, container = document.body) {
    const { buttons = [], text, title } = props;

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

  renderButton = (button = {}) => (
    <Btn
      key={button.text}
      className={classNames('', {
        'ecos-btn_blue ecos-btn_hover_light-blue': !button.isDefault
      })}
      onClick={button.handler.bind(this)}
    >
      {t(button.text)}
    </Btn>
  );

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

export default new PopupManager();
