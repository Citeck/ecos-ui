import ReactDOM from 'react-dom';
import React from 'react';

import { UploadNewVersion } from '../components/formAction';

export class VersionsJournalService {
  static addVersion(params = {}) {
    const { record, onClose } = params;
    const container = document.createElement('div');

    const onCloseModal = done => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      onClose(done);
    };

    ReactDOM.render(<UploadNewVersion record={record} onClose={onCloseModal} />, container);

    document.body.appendChild(container);
  }
}
