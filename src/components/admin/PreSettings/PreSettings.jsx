import React from 'react';
import { createRoot } from 'react-dom/client';

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

    const root = createRoot(this.el);

    const handleUnmount = () => {
      try {
        root.unmount();
      } catch (e) {
        console.error(e);
      }
    };

    root.render(
      <PreSettingsModal
        isOpen
        type={presettingsType}
        recordRef={recordRef}
        callback={callback}
        config={config}
        onHide={handleUnmount}
        toggleLoader={toggleLoader}
      />
    );
  };
}

export default PreSettings;
