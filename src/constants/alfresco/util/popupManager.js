import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { NotificationManager } from 'react-notifications';

import { TunableDialog } from '../../../components/common/dialogs';
import { t } from '../../../helpers/util';
import { Btn } from '../../../components/common/btns';
import { Input } from '../../../components/common/form';

class PopupManager {
  constructor() {
    console.warn('PopupManager');
  }

  #modal = null;
  #container = null;
  #modalWillBeDestroyed = false;
  #inputValue = '';

  zIndex = 15;

  get defaultDisplayMessageConfig() {
    return {
      title: null,
      text: null,
      spanClass: 'message',
      displayTime: 2.5,
      // effect: YAHOO.widget.ContainerEffect.FADE,
      effectDuration: 0.5,
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
          handler: function() {
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
          handler: function() {
            this.destroy();
          }
        }
      ]
    };
  }

  createModal(props, container = document.body) {
    if (!this.#modal) {
      return;
    }

    this.#container = document.createElement('div');

    this.render({
      ...props,
      onClose: this.onClose
    });

    container.appendChild(this.#container);
  }

  render = (props = {}, callback = () => null) => {
    ReactDOM.render(React.createElement(this.#modal, props), this.#container, callback);
  };

  /**
   * Destruction of the container from the DOM and the modal from memory.
   * The timer is needed so that when calling with opening new modal windows,
   * there are no errors that the modal window has already been deleted.
   * Cleaning is necessary so that unused data and an element in the DOM tree do not hang.
   * @type {debounced}
   */
  destroyModal = debounce(() => {
    if (!this.#modalWillBeDestroyed) {
      return;
    }

    console.warn('destroyModal');
    // this.unmount();

    console.warn(this.#container);

    // this.#modal = null;
    // this.#container = null;
    this.#modalWillBeDestroyed = false;
    this.#inputValue = false;
  }, 5000);

  onClose = () => {
    if (!this.#modal || !this.#container) {
      return;
    }

    console.warn('onClose');

    this.#modalWillBeDestroyed = true;

    const container = this.#container;

    this.render({ isOpen: false }, () => {
      this.destroyModal();
      // this.dl(container);
    });
  };

  dl(container = null) {
    if (!container) {
      return;
    }

    console.warn('dl', { container });

    document.body.removeChild(this.#container);
    ReactDOM.unmountComponentAtNode(this.#container);
  }

  destroy() {
    this.onClose();
  }

  hideModal() {
    this.render({ isOpen: false });
  }

  unmount() {
    if (this.#container) {
      document.body.removeChild(this.#container);
      ReactDOM.unmountComponentAtNode(this.#container);
    }
  }

  cancelDestroy = () => {
    this.#modalWillBeDestroyed = false;
    this.destroyModal.cancel();
  };

  displayMessage(props = {}, container = document.body) {
    if (props.text === undefined) {
      throw new Error('Property text in userConfig must be set');
    }

    const text = props.text
      .trim()
      .split(/\r\n|\r|\n/g)
      .map((item, i) => <div key={i}>{item}</div>);

    // NotificationManager.info('', t(props.text));

    // props.text.trim().split(/\r\n|\r|\n/g).map((item, i) => {
    //   NotificationManager.info('', t(item), 3000 + i * 500);
    // });

    this.#modal = TunableDialog;
    this.createModal(
      {
        isOpen: true,
        noHeader: true,
        content: text,
        className: 'ecos-modal_center'
      },
      container
    );
  }

  displayPrompt(props = {}, container = document.body) {
    const { buttons = [], text, title } = props;

    this.cancelDestroy();
    this.#modal = TunableDialog;
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
    this.cancelDestroy();

    const { okButtonText = 'Ok', title = '', text = '', callback: { fn = () => null } = {}, buttons = [] } = props;
    let footer = buttons.length
      ? buttons.map(this.renderButton)
      : [
          <Btn
            key={okButtonText}
            className={'ecos-btn_blue ecos-btn_hover_light-blue'}
            onClick={() => {
              this.render({ isOpen: false }, () => {
                this.unmount();
                fn(this.#inputValue);
              });
            }}
          >
            {t(okButtonText)}
          </Btn>,
          <Btn key="cancel" onClick={this.destroy.bind(this)}>
            {t('btn.cancel.label')}
          </Btn>
        ];

    this.#modal = TunableDialog;
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
}

export default new PopupManager();
