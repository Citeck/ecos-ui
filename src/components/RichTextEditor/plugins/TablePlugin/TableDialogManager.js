import React from 'react';
import ReactDOM from 'react-dom';
import TableDialog from './TableDialog';

class TableDialogManager {
  constructor() {
    this.init();
  }

  init = () => {
    if (!this.el) {
      this.el = document.createElement('div');
    }

    document.body.appendChild(this.el);
  };

  open = editor => {
    ReactDOM.render(<TableDialog isOpen editor={editor} onHide={this.hide} />, this.el);
  };

  hide = () => {
    try {
      ReactDOM.unmountComponentAtNode(this.el);
    } catch (e) {
      console.error(e);
    }
  };
}

export default TableDialogManager;
