import React from 'react';
import ReactDOM from 'react-dom';
import PreSettingsModal from './PreSettingsModal';

class PreSettings {
  constructor() {
    this.init();
  }

  init = () => {
    if (!this.el) {
      this.el = document.createElement('div');
    }

    document.body.appendChild(this.el);
  };

  open = (recordRef, config, callback, toggleLoader) => {
    const { presettingsType } = config;

    const handleUnmount = () => {
      try {
        ReactDOM.unmountComponentAtNode(this.el);
      } catch (e) {
        console.error(e);
      }
    };

    ReactDOM.render(
      <PreSettingsModal
        isOpen
        type={presettingsType}
        recordRef={recordRef}
        callback={callback}
        config={config}
        onHide={handleUnmount}
        toggleLoader={toggleLoader}
      />,
      this.el
    );
  };
}

export default PreSettings;
